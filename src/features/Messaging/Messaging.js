import React, { useState, useEffect } from 'react'; // Import React and hooks
import { db } from '../../services/firebase'; // Firebase Firestore instance
import {
  collection, query, getDocs, orderBy, onSnapshot,
  addDoc, serverTimestamp, where, doc, setDoc, getDoc, deleteDoc
} from 'firebase/firestore'; // Firestore functions for database operations
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase authentication

// Messaging component
const Messaging = () => {
  // State variables
  const [friends, setFriends] = useState([]); // List of user's friends
  const [currentUser, setCurrentUser] = useState(null); // Current authenticated user
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat (private/group/project)
  const [messages, setMessages] = useState([]); // Messages in the current chat
  const [newMessage, setNewMessage] = useState(''); // Message input field
  const [groupChats, setGroupChats] = useState([]); // User's group chats
  const [projectChats, setProjectChats] = useState([]); // User's project chats
  const [creatingGroup, setCreatingGroup] = useState(false); // State to toggle group creation
  const [newGroupName, setNewGroupName] = useState(''); // New group chat name
  const [selectedFriends, setSelectedFriends] = useState([]); // Friends selected to add to a new group
  const [viewingGroupMembers, setViewingGroupMembers] = useState(false); // Toggle viewing group members
  const [groupMembers, setGroupMembers] = useState([]); // List of group members
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false); // Confirmation modal for leaving a group

  const auth = getAuth(); // Get Firebase authentication instance

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user); // Set logged-in user
        await fetchFriends(user.uid); // Fetch friends list
        await fetchGroupChats(user.uid); // Fetch group chats
        await fetchProjectChats(user.uid); // Fetch project chats
      }
    });
    return () => unsubscribe(); // Clean up listener
  }, [auth]);

  // Fetch user's friends from Firestore
  const fetchFriends = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();
      const friendsIds = userData.friends || [];

      const friendsData = await Promise.all(
        friendsIds.map(async (friendId) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          return { id: friendId, ...friendDoc.data() };
        })
      );

      setFriends(friendsData);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Fetch user's group chats
  const fetchGroupChats = async (uid) => {
    try {
      const groupChatsRef = collection(db, 'groupChats');
      const q = query(groupChatsRef, where('participants', 'array-contains', uid));
      const snapshot = await getDocs(q);
      const allGroupChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredGroupChats = allGroupChats.filter(chat => chat.type !== 'project');
      setGroupChats(filteredGroupChats);
    } catch (error) {
      console.error('Error fetching group chats:', error);
    }
  };

  // Fetch user's project chats
  const fetchProjectChats = async (uid) => {
    try {
      const projectChatsRef = collection(db, 'groupChats');
      const q = query(projectChatsRef, where('type', '==', 'project'), where('participants', 'array-contains', uid));
      const snapshot = await getDocs(q);
      setProjectChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching project chats:', error);
    }
  };

  // Fetch messages for the selected chat (private or group)
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    const messagesRef = selectedChat.type === 'group' || selectedChat.type === 'project'
      ? collection(db, 'groupChats', selectedChat.id, 'messages')
      : collection(db, 'chats', selectedChat.chatId, 'messages');

    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe(); // Clean up listener
  }, [selectedChat, currentUser]);

  // Handle sending a message (private, group, or project)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      senderPhoto: currentUser.photoURL || '/default-avatar.png',
      timestamp: serverTimestamp(),
    };

    try {
      if (selectedChat.type === 'group' || selectedChat.type === 'project') {
        // Send message to group or project chat
        await addDoc(collection(db, 'groupChats', selectedChat.id, 'messages'), messageData);
      } else {
        // Send private message
        await addDoc(collection(db, 'chats', selectedChat.chatId, 'messages'), messageData);

        // Update last message info
        await setDoc(doc(db, 'chats', selectedChat.chatId), {
          id: selectedChat.chatId,
          participants: [currentUser.uid, selectedChat.friend.id],
          lastMessage: newMessage,
          timestamp: serverTimestamp(),
        }, { merge: true });
      }
      setNewMessage(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Start a new private chat with a friend
  const handleStartPrivateChat = (friend) => {
    const chatId = [currentUser.uid, friend.id].sort().join('_'); // Consistent chat ID based on users
    setSelectedChat({ type: 'private', chatId, friend });
  };

  // Start or join an existing group chat
  const handleStartGroupChat = (group) => {
    setSelectedChat({ type: group.type, id: group.id, group });
  };

  // Create a new group chat
  const handleCreateGroupChat = async () => {
    if (!newGroupName.trim() || selectedFriends.length < 1) return;

    const newGroup = {
      groupName: newGroupName,
      participants: [currentUser.uid, ...selectedFriends],
      createdAt: serverTimestamp(),
      type: 'group',
    };

    try {
      const groupDoc = await addDoc(collection(db, 'groupChats'), newGroup); // Add new group to Firestore
      setCreatingGroup(false);
      setNewGroupName('');
      setSelectedFriends([]);
      await fetchGroupChats(currentUser.uid); // Refresh group list
      setSelectedChat({ type: 'group', id: groupDoc.id, group: newGroup }); // Auto open the newly created group
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  // Fetch group members' data based on participant UIDs
  const fetchGroupMembers = async (group) => {
    try {
      const membersData = await Promise.all(
        group.participants.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          return { id: uid, ...userDoc.data() };
        })
      );
      setGroupMembers(membersData); // Update group members state
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  // Handle user leaving a group or project chat
  const handleLeaveGroup = async () => {
    if (!selectedChat || (selectedChat.type !== 'group' && selectedChat.type !== 'project')) return;

    const groupRef = doc(db, 'groupChats', selectedChat.id);

    try {
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();
      const updatedParticipants = groupData.participants.filter(uid => uid !== currentUser.uid);

      if (updatedParticipants.length === 0) {
        // If no members left, delete the group
        await deleteDoc(groupRef);
      } else {
        // Otherwise, update the participants
        await setDoc(groupRef, { participants: updatedParticipants }, { merge: true });
      }

      // If it's a project group, also update/remove project membership
      if (selectedChat.type === 'project') {
        const projectRef = doc(db, 'projects', selectedChat.id);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const updatedMembers = projectData.members.filter(uid => uid !== currentUser.uid);

          if (updatedMembers.length === 0) {
            await deleteDoc(projectRef);
          } else {
            await setDoc(projectRef, { members: updatedMembers }, { merge: true });
          }
        }
      }

      setSelectedChat(null); // Reset selected chat
      await fetchGroupChats(currentUser.uid); // Refresh chats
      await fetchProjectChats(currentUser.uid);
      setViewingGroupMembers(false); // Hide group members view
    } catch (error) {
      console.error('Error leaving group/project:', error);
    }
  };

  // Render the Messaging UI
  return (
    <div style={{ display: 'flex', height: '100vh' }}>

      {/* Left Sidebar: Friends, Group Chats, Projects */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>

        {/* Friends Section */}
        <h2>Friends</h2>
        {friends.map(friend => (
          <div
            key={friend.id}
            style={{
              padding: '8px',
              cursor: 'pointer',
              background: selectedChat?.friend?.id === friend.id ? '#eee' : 'transparent'
            }}
            onClick={() => handleStartPrivateChat(friend)}
          >
            <img
              src={friend.photoURL || '/default-avatar.png'}
              alt="avatar"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                marginRight: '8px'
              }}
            />
            {friend.displayName}
          </div>
        ))}

        {/* Group Chats Section */}
        <h2 style={{ marginTop: '20px' }}>Group Chats</h2>
        {groupChats.map(group => (
          <div
            key={group.id}
            style={{
              padding: '8px',
              cursor: 'pointer',
              background: selectedChat?.id === group.id ? '#eee' : 'transparent'
            }}
            onClick={() => handleStartGroupChat(group)}
          >
            📢 {group.groupName}
          </div>
        ))}

        {/* Projects Section */}
        <h2 style={{ marginTop: '20px' }}>Projects</h2>
        {projectChats.map(project => (
          <div
            key={project.id}
            style={{
              padding: '8px',
              cursor: 'pointer',
              background: selectedChat?.id === project.id ? '#eee' : 'transparent'
            }}
            onClick={() => handleStartGroupChat(project)}
          >
            {project.groupName}
          </div>
        ))}

        {/* Button to create a new group chat */}
        <button
          onClick={() => setCreatingGroup(true)}
          style={{
            marginTop: '20px',
            padding: '10px',
            width: '100%',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ➕ New Group Chat
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Chat Header */}
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center' }}>
          <strong>
            {selectedChat?.type === 'group' || selectedChat?.type === 'project'
              ? selectedChat.group.groupName
              : selectedChat?.friend?.displayName || 'Select a chat'}
          </strong>

          {/* View Group Members Button */}
          {(selectedChat?.type === 'group' || selectedChat?.type === 'project') && (
            <button
              onClick={async () => {
                await fetchGroupMembers(selectedChat.group);
                setViewingGroupMembers(true);
              }}
              style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}
            >
              👥 View Members
            </button>
          )}
        </div>

        {/* Messages List */}
        <div style={{ flexGrow: 1, padding: '10px', overflowY: 'auto' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img
                src={msg.senderPhoto}
                alt="avatar"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  marginRight: '10px'
                }}
              />
              <div>
                <strong>{msg.senderName}</strong>: {msg.text}
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {msg.timestamp?.toDate().toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        {selectedChat && (
          <div style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flexGrow: 1, padding: '8px' }}
            />
            <button
              onClick={handleSendMessage}
              style={{ marginLeft: '10px', padding: '8px' }}
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* View Group Members Modal */}
      {viewingGroupMembers && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px',
            borderRadius: '12px', width: '300px', position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setViewingGroupMembers(false)}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'
              }}
            >❌</button>

            {/* Group Members List */}
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Group Members</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
              {groupMembers.map(member => (
                <div key={member.id} style={{ padding: '5px 0' }}>
                  {member.displayName || 'Unknown'}
                </div>
              ))}
            </div>

            {/* Button to open leave group confirmation */}
            <button
              onClick={() => setConfirmLeaveOpen(true)}
              style={{
                width: '100%', padding: '10px',
                backgroundColor: '#ff4d4d', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer'
              }}
            >
              🚪 Leave Group
            </button>
          </div>

          {/* Confirm Leave Group Modal */}
          {confirmLeaveOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}>
              <div style={{
                backgroundColor: 'white', padding: '20px',
                borderRadius: '12px', width: '300px', textAlign: 'center'
              }}>
                <h3>Are you sure you want to leave?</h3>

                {/* Yes/No Buttons */}
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-around' }}>
                  <button
                    onClick={async () => {
                      await handleLeaveGroup();
                      setConfirmLeaveOpen(false);
                    }}
                    style={{
                      backgroundColor: '#ff4d4d', color: 'white',
                      border: 'none', borderRadius: '6px', padding: '10px 20px',
                      cursor: 'pointer'
                    }}
                  >
                    Yes, Leave
                  </button>
                  <button
                    onClick={() => setConfirmLeaveOpen(false)}
                    style={{
                      backgroundColor: '#ccc', color: '#333',
                      border: 'none', borderRadius: '6px', padding: '10px 20px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Group Chat Modal */}
      {creatingGroup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px',
            borderRadius: '12px', width: '400px', position: 'relative'
          }}>

            {/* Close Button */}
            <button
              onClick={() => setCreatingGroup(false)}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'
              }}
            >
              ❌
            </button>

            {/* Modal Title */}
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Create Group Chat</h3>

            {/* Input for Group Name */}
            <input
              type="text"
              placeholder="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{
                width: '100%', padding: '10px',
                marginBottom: '15px', borderRadius: '6px',
                border: '1px solid #ccc'
              }}
            />

            {/* Friend List for Selecting Participants */}
            <div style={{
              maxHeight: '200px', overflowY: 'auto',
              marginBottom: '15px', border: '1px solid #ccc',
              padding: '10px', borderRadius: '6px'
            }}>
              {friends.map(friend => (
                <div key={friend.id} style={{ marginBottom: '8px' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriends([...selectedFriends, friend.id]);
                        } else {
                          setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    {friend.displayName}
                  </label>
                </div>
              ))}
            </div>

            {/* Button to create the group */}
            <button
              onClick={handleCreateGroupChat}
              style={{
                width: '100%', padding: '10px',
                backgroundColor: '#007bff', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer'
              }}
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;

import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import {
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';

const ProjectManagement = () => {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  const [assignedTo, setAssignedTo] = useState('');
  const [taskStatus, setTaskStatus] = useState('Not Started');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [sortOption, setSortOption] = useState('priority');
  const [joinRequestsData, setJoinRequestsData] = useState([]);




  const auth = getAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const proj = { id: projectSnap.id, ...projectSnap.data() };
        setProject(proj);

        const memberDocs = await Promise.all(
          (proj.members || []).map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() ? { id: uid, ...userDoc.data() } : null;
          })
        );
        setMembersData(memberDocs.filter(Boolean));

        const requestDocs = await Promise.all(
          (proj.joinRequests || []).map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() ? { id: uid, ...userDoc.data() } : null;
          })
        );
        setJoinRequestsData(requestDocs.filter(Boolean));

        const tasksSnapshot = await getDocs(collection(db, 'projects', projectId, 'tasks'));
        const taskList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(taskList);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateTaskTitle = async (taskId) => {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, { title: editedTaskTitle });
      setEditingTaskId(null);
      setEditedTaskTitle('');
      fetchProject();
    } catch (error) {
      console.error('Error updating task title:', error);
    }
  };


  const handleCreateTask = async () => {
    if (!newTask.trim()) return;
    try {
      await addDoc(collection(db, 'projects', projectId, 'tasks'), {
        title: newTask,
        deadline: newDeadline || null,
        completed: taskStatus === 'Completed',
        assignedTo: assignedTo || null,
        status: taskStatus,
        priority: priority,
      });


      setNewTask('');
      setNewDeadline('');
      fetchProject();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleLeaveProject = async () => {
    if (!auth.currentUser) return;
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) return;

      const projectData = projectSnap.data();
      const updatedMembers = projectData.members.filter(id => id !== auth.currentUser.uid);

      if (updatedMembers.length === 0) {
        await deleteDoc(projectRef);
        navigate('/dashboard');
      } else {
        await updateDoc(projectRef, { members: updatedMembers });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error leaving project:', error);
    }
  };

  // Update role of a member
  const updateRole = async (uid, newRole) => {
    if (!project) return;
    const projectRef = doc(db, 'projects', projectId);
    const updatedRoles = { ...project.roles, [uid]: newRole };
    await updateDoc(projectRef, { roles: updatedRoles });
    fetchProject();
    setSelectedMember(null);
  };

  // Kick a member from the project
  const kickMember = async (uid) => {
    if (!project) return;
    const projectRef = doc(db, 'projects', projectId);
    const updatedMembers = project.members.filter(member => member !== uid);
    const updatedRoles = { ...project.roles };
    delete updatedRoles[uid];
    await updateDoc(projectRef, { members: updatedMembers, roles: updatedRoles });
    fetchProject();
    setSelectedMember(null);
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
      fetchProject();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleUpdateTaskAssignee = async (taskId, newAssigneeId) => {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, { assignedTo: newAssigneeId });
      fetchProject();
    } catch (error) {
      console.error('Error updating task assignee:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await deleteDoc(taskRef);
      fetchProject();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAcceptRequest = async (userId) => {
    if (!project) return;
    const projectRef = doc(db, 'projects', projectId);

    const updatedMembers = [...(project.members || []), userId];
    const updatedRequests = project.joinRequests.filter(id => id !== userId);

    await updateDoc(projectRef, {
      members: updatedMembers,
      joinRequests: updatedRequests,
    });

    fetchProject();
  };

  const handleRejectRequest = async (userId) => {
    if (!project) return;
    const projectRef = doc(db, 'projects', projectId);

    const updatedRequests = project.joinRequests.filter(id => id !== userId);

    await updateDoc(projectRef, {
      joinRequests: updatedRequests,
    });

    fetchProject();
  };



  const isOwner = project?.creator === auth.currentUser?.uid;

  const getRole = (uid) => {
    return project.roles?.[uid] || 'Member';
  };

  if (loading) return <div style={{ padding: '20px', color: 'white' }}>Loading project info...</div>;
  if (!project) return <div style={{ padding: '20px', color: 'white' }}>Project not found.</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#121212', color: 'white', minHeight: '100vh' }}>
      <h1>{project.title}</h1>
      <p><strong>Description:</strong> {project.description || 'No description'}</p>
      <p><strong>Difficulty:</strong> {project.difficulty || 'Unknown'}</p>
      <p><strong>Team Size:</strong> {project.teamSize || 'Unknown'}</p>

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Sort By:</label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          style={inputStyle}
        >
          <option value="priority">Priority 🔥</option>
          <option value="dueDate">Closest Due Date 📅</option>
          <option value="overdue">Overdue First ⏳</option>
          <option value="status">Status 📋</option>
        </select>
      </div>


      <h2>Team Members</h2>
      {isOwner && joinRequestsData.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Pending Join Requests</h2>
          <ul>
            {joinRequestsData.map((user) => (
              <li key={user.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <div
                  onClick={() => navigate(`/profile/${user.id}`)}
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <img
                    src={user.photoURL || '/default-avatar.png'}
                    alt="profile"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                  />
                  <span style={{ color: 'white' }}>
                    {user.username || user.displayName || 'Unnamed User'}
                  </span>
                </div>

                <div style={{ marginLeft: 'auto' }}>
                  <button
                    style={{ ...smallButton, backgroundColor: '#4CAF50' }}
                    onClick={() => handleAcceptRequest(user.id)}
                  >
                    Accept ✅
                  </button>
                  <button
                    style={{ ...smallButton, marginLeft: '5px', backgroundColor: '#ff4d4d' }}
                    onClick={() => handleRejectRequest(user.id)}
                  >
                    Reject ❌
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}



      <ul>
        {membersData.map((member) => {
          const role = getRole(member.id);
          let roleColor;
          if (role === 'Owner') roleColor = '#FFD700';
          else if (role === 'Co-Owner') roleColor = '#87CEFA';
          else roleColor = '#FFFFFF';

          return (
            <li key={member.id} style={{ marginBottom: '10px' }}>
              <span style={{ color: roleColor }}>
                {member.username || member.displayName || 'Unnamed User'}
                {role === 'Owner' && ' 👑'} { }
              </span>
              <span style={{ color: '#aaa', marginLeft: '6px' }}>({role})</span>
              {isOwner && member.id !== auth.currentUser.uid && (
                <button
                  onClick={() => setSelectedMember(member)}
                  style={smallButton}
                >
                  ⚙️
                </button>
              )}
            </li>
          );
        })}
      </ul>


      {selectedMember && (
        <div style={modalStyle}>
          <h3>Manage {selectedMember.username || selectedMember.displayName}</h3>
          <button onClick={() => updateRole(selectedMember.id, 'Co-Owner')} style={modalButton}>Promote to Co-Owner</button>
          <button onClick={() => updateRole(selectedMember.id, 'Member')} style={modalButton}>Demote to Member</button>
          <button onClick={() => kickMember(selectedMember.id)} style={kickButton}>Kick from Project</button>
          <button onClick={() => setSelectedMember(null)} style={closeButton}>Close</button>
        </div>
      )}

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      <h2>Tasks</h2>
      {isOwner && (
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Task Title"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            style={inputStyle}
          />
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{ ...inputStyle, marginLeft: '10px' }}
          >
            <option value="">Assign to...</option>
            {membersData.map(member => (
              <option key={member.id} value={member.id}>
                {member.username || member.displayName || 'Unnamed User'}
              </option>
            ))}
          </select>

          <select
            value={taskStatus}
            onChange={(e) => setTaskStatus(e.target.value)}
            style={{ ...inputStyle, marginLeft: '10px', marginTop: '10px' }}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ ...inputStyle, marginLeft: '10px', marginTop: '10px' }}
          >
            <option value="Low">Low Priority 🟢</option>
            <option value="Medium">Medium Priority 🟠</option>
            <option value="High">High Priority 🔥</option>
          </select>


          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            style={{ ...inputStyle, marginLeft: '10px' }}
          />
          <button onClick={handleCreateTask} style={buttonStyle}>➕ Add Task</button>
        </div>)}

      {tasks.length > 0 ? (
        <ul style={{ marginTop: '10px' }}>
          {[...tasks]
            .sort((a, b) => {
              if (sortOption === 'priority') {
                const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
              }
              if (sortOption === 'dueDate') {
                return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
              }
              if (sortOption === 'overdue') {
                const now = new Date();
                const aOverdue = a.deadline && new Date(a.deadline) < now && a.status !== 'Completed';
                const bOverdue = b.deadline && new Date(b.deadline) < now && b.status !== 'Completed';
                return (bOverdue === aOverdue) ? 0 : bOverdue ? -1 : 1;
              }
              if (sortOption === 'status') {
                const statusOrder = { 'In Progress': 0, 'Not Started': 1, 'Completed': 2 };
                return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
              }
              return 0;
            })
            .map(task => {
              const assignedMember = membersData.find(member => member.id === task.assignedTo);
              const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Completed';
              const canEdit = isOwner || task.assignedTo === auth.currentUser?.uid;

              return (
                <li key={task.id} style={{ marginBottom: '15px', color: overdue ? 'red' : 'white' }}>
                  <div>
                    {editingTaskId === task.id ? (
                      <>
                        <input
                          type="text"
                          value={editedTaskTitle}
                          onChange={(e) => setEditedTaskTitle(e.target.value)}
                          style={{ ...inputStyle, marginTop: '5px', marginRight: '5px' }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateTaskTitle(task.id)}
                          style={{ ...smallButton, backgroundColor: '#4CAF50', marginLeft: '5px' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTaskId(null);
                            setEditedTaskTitle('');
                          }}
                          style={{ ...smallButton, backgroundColor: '#555', marginLeft: '5px' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <strong>{task.title}</strong>
                        {task.priority && (
                          <span style={{
                            marginLeft: '8px',
                            color: task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'lightgreen',
                            fontWeight: 'bold',
                          }}>
                            ({task.priority})
                          </span>
                        )}
                        {(isOwner || task.assignedTo === auth.currentUser?.uid) && (
                          <button
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setEditedTaskTitle(task.title);
                            }}
                            style={{ ...smallButton, marginLeft: '5px' }}
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}

                    {task.status === 'Completed' && (
                      <span style={{ color: 'lightgreen', marginLeft: '5px' }}>✅</span>
                    )}

                    { }
                    {overdue && (
                      <span style={{ color: 'yellow', marginLeft: '5px', fontWeight: 'bold' }}>
                        ⚠️ Overdue
                      </span>
                    )}

                    {task.deadline && <span style={{ color: '#aaa' }}> (Due: {task.deadline})</span>}

                    <br />

                    <span style={{ fontSize: '12px', color: '#bbb' }}>
                      Status: {task.status}
                      {assignedMember && ` | Assigned to: ${assignedMember.username || assignedMember.displayName}`}
                    </span>
                    <br />

                    {canEdit && (
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        style={{ ...inputStyle, marginTop: '5px', marginRight: '5px', width: '150px' }}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    )}

                    {isOwner && (
                      <>
                        <select
                          value={task.assignedTo || ''}
                          onChange={(e) => handleUpdateTaskAssignee(task.id, e.target.value)}
                          style={{ ...inputStyle, marginTop: '5px', marginRight: '5px', width: '150px' }}
                        >
                          <option value="">Unassigned</option>
                          {membersData.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.username || member.displayName}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ ...smallButton, backgroundColor: '#ff4d4d', marginLeft: '5px', marginTop: '5px' }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      ) : (
        <p>No tasks added yet.</p>
      )}



      <div style={{ marginTop: '40px' }}>
        <button onClick={handleLeaveProject} style={leaveButton}>🚪 Leave Project</button>
      </div>
    </div>
  );
};


const inputStyle = {
  padding: '8px',
  borderRadius: '5px',
  border: '1px solid #444',
  backgroundColor: '#1f1f1f',
  color: 'white',
};

const buttonStyle = {
  padding: '10px 15px',
  marginLeft: '10px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const leaveButton = {
  padding: '10px 20px',
  backgroundColor: '#ff4d4d',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const smallButton = {
  marginLeft: '10px',
  backgroundColor: '#333',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '12px',
};

const modalStyle = {
  position: 'fixed',
  top: '30%',
  left: '50%',
  transform: 'translate(-50%, -30%)',
  backgroundColor: '#222',
  padding: '30px',
  borderRadius: '10px',
  zIndex: 1000,
  textAlign: 'center',
};

const modalButton = {
  marginTop: '10px',
  display: 'block',
  width: '100%',
  padding: '10px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const kickButton = {
  ...modalButton,
  backgroundColor: '#ff4d4d',
};

const closeButton = {
  marginTop: '10px',
  display: 'block',
  width: '100%',
  padding: '10px',
  backgroundColor: '#555',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

export default ProjectManagement;
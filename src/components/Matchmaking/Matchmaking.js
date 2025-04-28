import React, { useState, useEffect, useCallback } from "react"; // Importing React and hooks
import { db } from "../../services/firebase"; // Importing Firebase database
import { collection, getDocs } from "firebase/firestore"; // Importing Firestore functions
import { useNavigate } from "react-router-dom"; // Importing React Router's useNavigate hook

const Matchmaking = () => { // Main component for matchmaking
  const [projects, setProjects] = useState([]); // State to hold projects
  const [loggedInUser, setLoggedInUser] = useState(null); // State to hold logged-in user
  const [matches, setMatches] = useState([]); // State to hold matches
  const navigate = useNavigate(); // Hook to navigate between routes

  // useEffect hook runs after the component mounts (empty dependency array [])
  useEffect(() => {
    // Define an asynchronous function to fetch data from Firestore
    const fetchData = async () => {
      try {
        // Fetch all documents from the "projects" collection
        const projectSnapshot = await getDocs(collection(db, "projects"));

        // Map through the fetched documents to create a list of project objects
        const projectList = projectSnapshot.docs.map((doc) => ({
          id: doc.id,      // Store the document ID
          ...doc.data(),   // Spread the document data
        }));

        // Update the 'projects' state with the fetched project list
        setProjects(projectList);

        // Fetch all documents from the "users" collection
        const userSnapshot = await getDocs(collection(db, "users"));

        // Map through the fetched documents to create a list of user objects
        const userList = userSnapshot.docs.map((doc) => ({
          id: doc.id,      // Store the document ID
          ...doc.data(),   // Spread the document data
        }));

        // Assume the first user in the list is the logged-in user (you might want to adjust this)
        const loggedIn = userList[0];

        // Update the 'loggedInUser' state with the fetched user
        setLoggedInUser(loggedIn);
      } catch (error) {
        // Log any errors that occur during fetching
        console.error("Error fetching data:", error);
      }
    };

    // Call the fetchData function
    fetchData();
  }, []); // Empty dependency array ensures this only runs once when the component mounts


  // Function to calculate how well a user matches a project based on shared attributes
  const calculateMatchScore = (user, project) => {
    // Extract and combine project 'tags' and 'skills' into a single array
    const projectAttributes = [
      ...(Array.isArray(project.tags) ? project.tags : []),  // Add 'tags' if it's an array
      ...(Array.isArray(project.skills) ? project.skills : []), // Add 'skills' if it's an array
    ];

    // Extract and combine user 'interests', 'skills', and 'languages' into a single array
    const userAttributes = [
      ...(Array.isArray(user.interests) ? user.interests : []), // Add 'interests' if it's an array
      ...(Array.isArray(user.skills) ? user.skills : []), // Add 'skills' if it's an array
      ...(Array.isArray(user.languages) ? user.languages : []), // Add 'languages' if it's an array
    ];

    // Find attributes that appear in both userAttributes and projectAttributes
    const commonAttributes = userAttributes.filter(attribute =>
      projectAttributes.includes(attribute)
    );

    // Return the number of matching attributes as the match score
    return commonAttributes.length;
  };


  // Define the matchmaking component logic
  const performMatchmaking = useCallback(() => {
    // If no user is logged in, exit early
    if (!loggedInUser) return;

    // Map through all projects to calculate match scores
    const allMatches = projects.map((project) => {
      const matchScore = calculateMatchScore(loggedInUser, project);

      // Only return matches where the score is greater than 0
      if (matchScore > 0) {
        return {
          userId: loggedInUser.id,
          username: loggedInUser.username || 'No username', // Fallback if username is missing
          projectId: project.id,
          projectName: project.title || 'No title',         // Fallback if project title is missing
          matchScore,
        };
      }
      return null; // Ignore non-matching projects
    }).filter(Boolean); // Remove null entries from the list

    // Sort matches by descending match score (higher scores first)
    allMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Update the state with the sorted matches
    setMatches(allMatches);
  }, [loggedInUser, projects]); // Dependencies: re-run if loggedInUser or projects change

  // useEffect to trigger matchmaking once loggedInUser and projects are loaded
  useEffect(() => {
    if (loggedInUser && projects.length > 0) {
      performMatchmaking();
    }
  }, [loggedInUser, projects, performMatchmaking]);

  // Function to handle clicking a project (navigates to the project's page)
  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  // Render the component
  return (
    <div style={{ padding: "20px" }}>
      <h2>Project Matchmaking</h2>

      {matches.length > 0 ? (
        <div>
          <h3>Top Matching Projects</h3>
          <ul>
            {matches.map((match, index) => (
              <li
                key={index}
                style={{
                  cursor: "pointer",
                  padding: "10px",
                  margin: "10px 0",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "6px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
                onClick={() => handleProjectClick(match.projectId)}
              >
                <strong>Project:</strong> {match.projectName} -{" "}
                <strong>Match Score:</strong> {match.matchScore}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No matches found.</p> // Display if there are no matches
      )}
    </div>
  );
};

export default Matchmaking; // Export the component


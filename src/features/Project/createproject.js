import React, { useState } from "react"; // Import React and hooks
import { db, auth } from "../../services/firebase"; // Import Firebase database and authentication
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore"; // Firestore functions

// CreateProject Component
const CreateProject = () => {
  // State variables for project details
  const [title, setTitle] = useState(""); // Project title
  const [description, setDescription] = useState(""); // Project description
  const [tags, setTags] = useState([]); // Selected project tags
  const [skills, setSkills] = useState([]); // Selected project skills
  const [difficulty, setDifficulty] = useState("Beginner"); // Project difficulty level
  const [teamSize, setTeamSize] = useState(5); // Desired team size
  const [loading, setLoading] = useState(false); // Loading state for form submission
  const [message, setMessage] = useState(""); // Success or error messages

  // Available tag options
  const availableTags = [
    "Web Development",
    "AI",
    "Mobile Apps",
    "Game Development",
    "Research",
    "Startup",
    "Data Science",
    "AI & Machine Learning",
    "Frontend Development",
    "Backend Development",
    "Database Management",
    "Cloud Computing",
    "Cybersecurity"
  ];

  // Available skill options
  const availableSkills = [
    "React",
    "Node.js",
    "Python",
    "Firebase",
    "Machine Learning",
    "AWS",
    "Java",
    "JavaScript",
    "C++",
    "Ruby",
    "Go",
    "Frontend Development",
    "Backend Development",
    "Database Management",
    "Cloud Computing",
    "Cybersecurity"
  ];

  // Handle creating a new project
  const handleCreateProject = async (e) => {
    e.preventDefault(); // Prevent form default behavior
    setLoading(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("You must be logged in to create a project.");
        setLoading(false);
        return;
      }

      // Add project to Firestore "projects" collection
      const projectDocRef = await addDoc(collection(db, "projects"), {
        title,
        description,
        tags,
        skills,
        difficulty,
        teamSize,
        creator: user.uid,
        createdAt: serverTimestamp(),
        members: [user.uid],
        roles: { [user.uid]: 'Owner' }, // Assign creator as project owner
      });

      // Create associated group chat for the project
      await setDoc(doc(db, "groupChats", projectDocRef.id), {
        groupName: title,
        participants: [user.uid],
        createdAt: serverTimestamp(),
        type: 'project',
        projectId: projectDocRef.id,
      });

      // Reset form fields after success
      setTitle("");
      setDescription("");
      setTags([]);
      setSkills([]);
      setDifficulty("Beginner");
      setTeamSize(5);
      setMessage("Project created successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Error creating project: " + error.message);
    }

    setLoading(false);
  };

  // Handle selecting/deselecting a checkbox item
  const handleCheckboxChange = (setter, values, value) => {
    if (values.includes(value)) {
      setter(values.filter((v) => v !== value)); // Remove if already selected
    } else {
      setter([...values, value]); // Add if not selected
    }
  };

  // Render the Create Project form
  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Page Title */}
      <h2>Create a New Project</h2>

      {/* Project Creation Form */}
      <form onSubmit={handleCreateProject}>
        {/* Project Title Input */}
        <input
          type="text"
          placeholder="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={styles.input}
        />

        {/* Project Description Input */}
        <textarea
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ ...styles.input, height: "100px" }}
        ></textarea>

        {/* Tags Selection */}
        <label><strong>Tags:</strong></label>
        <div style={styles.checkboxContainer}>
          {availableTags.map((tag) => (
            <label key={tag} style={styles.checkboxItem}>
              <input
                type="checkbox"
                value={tag}
                checked={tags.includes(tag)}
                onChange={() => handleCheckboxChange(setTags, tags, tag)}
              />
              {tag}
            </label>
          ))}
        </div>

        {/* Skills Selection */}
        <label><strong>Required Skills:</strong></label>
        <div style={styles.checkboxContainer}>
          {availableSkills.map((skill) => (
            <label key={skill} style={styles.checkboxItem}>
              <input
                type="checkbox"
                value={skill}
                checked={skills.includes(skill)}
                onChange={() => handleCheckboxChange(setSkills, skills, skill)}
              />
              {skill}
            </label>
          ))}
        </div>

        {/* Difficulty Level Dropdown */}
        <label><strong>Difficulty Level:</strong></label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={styles.input}
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Expert</option>
        </select>

        {/* Team Size Input */}
        <label><strong>Max Team Size:</strong></label>
        <input
          type="number"
          value={teamSize}
          onChange={(e) => setTeamSize(parseInt(e.target.value))}
          min={1}
          max={20}
          style={styles.input}
        />

        {/* Submit Button */}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>

      {/* Success or Error Message */}
      {message && <p>{message}</p>}
    </div>
  );
};

// Styles object for inputs, buttons, checkboxes
const styles = {
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  checkboxContainer: {
    display: "flex",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  checkboxItem: {
    marginRight: "10px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "18px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CreateProject; // Export the CreateProject component

import React, { useEffect, useState } from "react"; // React and hooks
import { db } from "../services/firebase"; // Firebase DB import
import { collection, getDocs } from "firebase/firestore"; // Firestore functions
import { useNavigate } from "react-router-dom"; // For navigation

// SearchProjects Component
const SearchProjects = () => {
  // State variables
  const [projects, setProjects] = useState([]); // All projects
  const [search, setSearch] = useState(""); // Search query
  const [loading, setLoading] = useState(true); // Loading state
  const [filterDifficulty, setFilterDifficulty] = useState("All"); // Difficulty filter
  const [filterSkill, setFilterSkill] = useState("All"); // Skill filter
  const [filterTag, setFilterTag] = useState("All"); // Tag filter
  const [sortOption, setSortOption] = useState("Newest"); // Sort option

  const navigate = useNavigate(); // For navigating to project details

  // Fetch projects once when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projectList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Get all unique tags and skills from projects
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags || [])));
  const allSkills = Array.from(new Set(projects.flatMap(p => p.skills || [])));

  // Apply search, filter, and sort logic
  const filteredProjects = projects
    .filter(project =>
      project.title.toLowerCase().includes(search.toLowerCase()) && // Title matches search
      (filterDifficulty === "All" || project.difficulty === filterDifficulty) && // Difficulty matches
      (filterSkill === "All" || (project.skills || []).includes(filterSkill)) && // Skill matches
      (filterTag === "All" || (project.tags || []).includes(filterTag)) // Tag matches
    )
    .sort((a, b) => { // Sorting logic
      if (sortOption === "Newest") {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      } else if (sortOption === "Oldest") {
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      } else if (sortOption === "Team Size (Low to High)") {
        return (a.members?.length || 0) - (b.members?.length || 0);
      } else if (sortOption === "Team Size (High to Low)") {
        return (b.members?.length || 0) - (a.members?.length || 0);
      }
      return 0;
    });

  // Render UI
  return (
    <div style={{ padding: "20px", maxWidth: "1300px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Discover Projects</h2>

      {/* Filters Section */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "30px" }}>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search projects by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
        />

        {/* Difficulty Filter */}
        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={filterSelectStyle}>
          <option value="All">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        {/* Skill Filter */}
        <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} style={filterSelectStyle}>
          <option value="All">All Skills</option>
          {allSkills.map(skill => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>

        {/* Tag Filter */}
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={filterSelectStyle}>
          <option value="All">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        {/* Sort Option */}
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={filterSelectStyle}>
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="Team Size (Low to High)">Team Size (Low to High)</option>
          <option value="Team Size (High to Low)">Team Size (High to Low)</option>
        </select>
      </div>

      {/* Display loading or projects */}
      {loading ? (
        <p>Loading projects...</p>
      ) : filteredProjects.length > 0 ? (
        <div style={projectsGridStyle}>
          {filteredProjects.map(project => {
            const currentSize = project.members?.length || 0;
            const maxSize = project.maxTeamSize || project.teamSize || 0;
            const isFull = maxSize > 0 && currentSize >= maxSize;

            return (
              <div
                key={project.id}
                style={projectCardStyle}
                onClick={() => navigate(`/project/${project.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {/* "FULL" badge if project is full */}
                {isFull && (
                  <div style={fullBadgeStyle}>
                    FULL
                  </div>
                )}

                {/* Project Title */}
                <h3 style={{ marginBottom: "10px" }}>{project.title}</h3>

                {/* Project Tags */}
                {project.tags?.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Tags:</strong> {project.tags.map(tag => (
                      <span key={tag} style={{ marginRight: "6px", color: "#4CAF50" }}>#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Project Skills */}
                {project.skills?.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Skills:</strong> {project.skills.join(", ")}
                  </div>
                )}

                {/* Difficulty */}
                {project.difficulty && (
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Difficulty:</strong> {project.difficulty}
                  </div>
                )}

                {/* Team Size */}
                <div style={{ marginBottom: "10px" }}>
                  <strong>Team:</strong> {currentSize} {maxSize ? `/ ${maxSize}` : ""} members
                </div>

                {/* View Details Button */}
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <button style={viewButtonStyle}>
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No projects match your search or filters.</p>
      )}
    </div>
  );
};

// --- Styles ---
const searchInputStyle = {
  flex: 2,
  minWidth: "200px",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const filterSelectStyle = {
  flex: 1,
  minWidth: "150px",
  padding: "10px",
  fontSize: "16px",
};

const projectsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "20px",
};

const projectCardStyle = {
  background: "#f9f9f9",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  position: "relative",
  cursor: "pointer",
  transition: "transform 0.2s",
};

const fullBadgeStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "#f44336",
  color: "white",
  padding: "4px 8px",
  borderRadius: "5px",
  fontSize: "12px",
  fontWeight: "bold",
};

const viewButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default SearchProjects;

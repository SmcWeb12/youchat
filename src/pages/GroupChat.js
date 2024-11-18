import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase/firebase"; 
import { doc, getDoc } from "firebase/firestore"; 

function GroupChatPage() {
  const { groupId } = useParams(); // URL से Group ID प्राप्त करें
  const [groupData, setGroupData] = useState(null);

  // Group Chat डेटा लोड करें
  useEffect(() => {
    const loadGroupChatData = async () => {
      const groupDoc = await getDoc(doc(db, "groupChats", groupId));
      if (groupDoc.exists()) {
        setGroupData(groupDoc.data());
      } else {
        console.log("Group not found!");
      }
    };

    loadGroupChatData();
  }, [groupId]);

  return (
    <div>
      {groupData ? (
        <div>
          <h2>Group Chat</h2>
          <p>Members: {groupData.users.join(", ")}</p> {/* यूज़र्स की लिस्ट */}
          {/* चैट UI यहां दिखाएं */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default GroupChatPage;

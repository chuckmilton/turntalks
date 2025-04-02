// app/join-room.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { firestore } from "../lib/firebase";
import { useRouter } from "expo-router";

export default function JoinRoom() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");

  const joinRoom = async () => {
    try {
      const roomRef = firestore.collection("rooms").doc(roomCode);
      const roomDoc = await roomRef.get();
      if (!roomDoc.exists) {
        alert("Room not found");
        return;
      }
      const participant = { id: Date.now().toString(), nickname };
      await roomRef.update({
        participants: firestore.FieldValue.arrayUnion(participant),
      });
      router.push(
        `/session?roomCode=${roomCode}&participantId=${participant.id}&nickname=${encodeURIComponent(
          nickname
        )}`
      );
    } catch (error) {
      console.error("Join room error:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Join Room</Text>
      <TextInput
        placeholder="Enter Room Code"
        value={roomCode}
        onChangeText={setRoomCode}
        className="w-full p-3 border border-gray-300 rounded mb-4"
      />
      <TextInput
        placeholder="Enter Nickname"
        value={nickname}
        onChangeText={setNickname}
        className="w-full p-3 border border-gray-300 rounded mb-4"
      />
      <Button title="Join" onPress={joinRoom} />
    </View>
  );
}

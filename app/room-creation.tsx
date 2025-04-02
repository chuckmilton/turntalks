// app/room-creation.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { firestore } from "../lib/firebase";
import { Timestamp } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { useRouter } from "expo-router";
// Import modular Firestore functions:
import { collection, doc, setDoc } from "firebase/firestore";

export default function RoomCreation() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<DocumentPicker.DocumentResult | null>(null);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === "success") {
        setFile(result);
      }
    } catch (error) {
      console.error("File pick error:", error);
    }
  };

  const createRoom = async () => {
    try {
      // Generate a unique room code (6-character string)
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomData = {
        prompt,
        file: file ? file.uri : null, // This URI is used for ChatGPT input.
        host: auth.currentUser?.uid,
        participants: [],
        responses: {},
        turnIndex: 0,
        status: "waiting",
        createdAt: Timestamp.now(),
      };

      // Use modular syntax: create a document reference and then write data.
      await setDoc(doc(firestore, "rooms", roomCode), roomData);
      router.push(`/session?roomCode=${roomCode}`);
    } catch (error) {
      console.error("Room creation error:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Create Room</Text>
      <TextInput
        placeholder="Enter AI prompt"
        value={prompt}
        onChangeText={setPrompt}
        className="w-full p-3 border border-gray-300 rounded mb-4"
      />
      <Button title="Attach File" onPress={pickFile} />
      {file && <Text className="mt-2">File: {file.name}</Text>}
      <View className="mt-4">
        <Button title="Create Room" onPress={createRoom} />
      </View>
    </View>
  );
}

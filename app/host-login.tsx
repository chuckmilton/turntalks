// app/host-login.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "expo-router";

export default function HostLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/room-creation");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-white">
      <Text className="text-2xl font-bold mb-8">Host Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        className="w-full p-3 border border-gray-300 rounded mb-4"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full p-3 border border-gray-300 rounded mb-4"
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

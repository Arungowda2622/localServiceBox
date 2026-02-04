import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../header/Header";
import colors from "../theme/colors";

import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ROLES = ["all", "admin", "user", "driver", "shopowner"];

const Users = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedRole, users]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);

      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (selectedRole === "all") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) => {
        const role = (user.role || "user").toLowerCase().trim();
        return role === selectedRole;
      });
      setFilteredUsers(filtered);
    }
  };

  const formatRoleLabel = (role) => {
    if (role === "shopowner") return "ShopOwner";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const renderItem = ({ item }) => {
    const role = (item.role || "user").toLowerCase().trim();

    const initials = item.fullName
      ? item.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";

    return (
      <View style={styles.card}>
        {/* LEFT */}
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{item.fullName || "No Name"}</Text>
            <Text style={styles.phone}>{item.phone || "No phone"}</Text>
          </View>
        </View>

        {/* RIGHT */}
        <View style={[styles.roleBadge, styles[`role_${role}`]]}>
          <Text style={[styles.roleText, styles[`roleText_${role}`]]}>
            {formatRoleLabel(role)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Users" navigation={navigation} />
      {/* 🔥 ROLE FILTER (ALWAYS TOP) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {ROLES.map((role) => {
          const active = selectedRole === role;
          return (
            <Pressable
              key={role}
              onPress={() => setSelectedRole(role)}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {formatRoleLabel(role)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 🔥 USER LIST */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Users;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 56,
  },
  filterBtn: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 10,
  },
  filterBtnActive: {
    backgroundColor: "#4F46E5",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    color: "#374151",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
    // flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
  },
    /* 🔥 Card */
  card: {
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
  },

  info: {
    marginLeft: 12,
    width: 220,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  phone: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  roleText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* ✅ ROLE COLORS */
  role_admin: { backgroundColor: "#FEF3C7" },
  role_user: { backgroundColor: "#E0F2FE" },
  role_driver: { backgroundColor: "#ECFDF5" },
  role_shopowner: { backgroundColor: "#FCE7F3" },

  roleText_admin: { color: "#92400E" },
  roleText_user: { color: "#0369A1" },
  roleText_driver: { color: "#065F46" },
  roleText_shopowner: { color: "#9D174D" },
});

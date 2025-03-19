import React, { memo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';

interface DropdownProps {
  label: string;
  items: { id: number; name: string }[];
  selectedItem: string | null;
  onSelect: (selected: string) => void;
  placeholder?: string;
}

const CustomDropdown: React.FC<DropdownProps> = ({ label, items, selectedItem, onSelect, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (itemName: string | null) => {
    onSelect(itemName);
    setModalVisible(false);

  };


  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, selectedItem && styles.dropdownButtonSelected,]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectedText, !selectedItem && styles.placeholder, selectedItem && styles.selectedTextActive]}>
          {selectedItem || placeholder}
        </Text>

        <Ionicons name="chevron-down" size={18} color={selectedItem ? "#fff" : "#ff008c"} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal transparent animationType="fade" visible={modalVisible}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Search Input */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
              />

              {/* Deselect option */}
              {selectedItem && (
                <TouchableOpacity style={styles.item} onPress={() => handleSelect(null)}>
                  <Text style={styles.itemText}>Deselect</Text>
                </TouchableOpacity>
              )}

              {/* Dropdown List */}
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item?.id?.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      selectedItem === item.name && styles.selectedItem,
                    ]}
                    onPress={() => {
                      onSelect(selectedItem === item.name ? "" : item.name); // Deselect if the same item is clicked again
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedItem === item.id.toString() && styles.selectedItemText,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedItem === item.id.toString() && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default memo(CustomDropdown);

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  selectedTextActive: {
    color: "#fff", // Change text color when selected
  },
  dropdownButtonSelected: {
    backgroundColor: "#ff008c", // Change background when selected
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff008c",
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f7b5cf",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffe4e1",
  },
  selectedText: {
    fontSize: 14,
    color: "#333",
  },
  placeholder: {
    color: "#aaa",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    alignSelf: "center"
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
    color: "#333",
  },
  item: {
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: {
    fontSize: 14,
    color: "#333",
  },
  selectedItem: {
    backgroundColor: "#ff008c",
  },
  selectedItemText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

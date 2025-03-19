import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

interface DropdownProps {
  label: string;
  items: { id: number; name: string }[];
  selectedItems: { id: number; name: string }[];
  onSelect: (selected: { id: number; name: string }[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<DropdownProps> = ({
  label,
  items,
  selectedItems=[],
  onSelect,
  placeholder,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (item: { id: number; name: string }) => {
    const isSelected = selectedItems.some((selected) => selected.id === item.id);
    let updatedSelection;
    if (isSelected) {
      updatedSelection = selectedItems.filter((selected) => selected.id !== item.id);
    } else {
      updatedSelection = [...selectedItems, item];
    }
    onSelect(updatedSelection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, selectedItems.length > 0 && styles.dropdownButtonSelected]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.selectedText,
            selectedItems.length === 0 && styles.placeholder,
          ]}
        >
          {selectedItems.length > 0
            ? selectedItems.map((item) => item.name).join(", ")
            : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={selectedItems.length > 0 ? "#fff" : "#ff008c"} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal transparent animationType="fade" visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}
        >
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

              {/* Dropdown List */}
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = selectedItems.some((selected) => selected.id === item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.item, isSelected && styles.selectedItem]}
                      onPress={() => toggleSelection(item)}
                    >
                      <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                        {item.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default MultiSelectDropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
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
  dropdownButtonSelected: {
    backgroundColor: "#ff008c",
  },
  selectedText: {
    fontSize: 14,
    color: "#ffffff",
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
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import CustomDropdown from '../Dropdown/CreateProfile/DropdownSelector';
import { dummydataforreligions, genderOptions } from '../../screens/CreateProfile/dummydata';
import { fetchFilteredProfiles } from '../../utils/FiltersLogic/FetchFilteredData';
import { useDispatch } from 'react-redux';
import { setFilteredProfiles } from '../../redux/FilteredUsersSlice';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { ageRange: number[]; religion: string; gender: string }) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [ageRange, setAgeRange] = useState<number[]>([18, 60]);
  const [gender, setGender] = useState<string>('');
  const [religion, setReligion] = useState<string>('');
  const dispatch = useDispatch();

  const applyFilters = useCallback(async () => {
    const filteredProfiles = await fetchFilteredProfiles(ageRange, religion, gender);
    dispatch(setFilteredProfiles(filteredProfiles))

    onApply({ ageRange, religion, gender });
    onClose();
  }, [ageRange, religion, gender, dispatch, onApply, onClose]);

  const handleInputChange = useCallback((type: string, value: string) => {
    if (type === 'gender') {
      setGender(value);
    } else if (type === 'religion') {
      setReligion(value);
    }
  }, []);

  const handleAgeChange = useCallback((value: number) => {
    setAgeRange([18, value]);
  }, []);


  const ageRaneText = useMemo(() => `${ageRange[0]} - ${ageRange[1]}`, [ageRange])
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Filter Profiles</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.label}>Age Range: {ageRaneText}</Text>
              <Slider
                minimumValue={18}
                maximumValue={60}
                step={1}
                value={ageRange[1]}
                onValueChange={handleAgeChange}
                minimumTrackTintColor="#ff008c"
                thumbTintColor="#ff008c"
              />
            </View>

            <View style={styles.filterSection}>

              <CustomDropdown
                label="Gender"
                items={genderOptions} // Use the dummy data 
                selectedItem={gender}
                onSelect={(selectedGender) => handleInputChange('gender', selectedGender)} // Update profile state
                placeholder={"Gender"}
              />
              <CustomDropdown
                label="Religion"
                items={dummydataforreligions} // Use the dummy data 
                selectedItem={religion}
                onSelect={(selectedReligion) => handleInputChange('religion', selectedReligion)}
                placeholder={"Religion"}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Pressable style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.buttonText}>Apply</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.5 : 1 }]} onPress={onClose}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10, // For spacing between elements
  },
  selectedAge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff008c',
  },
  selectedAgeContainer: {
    marginLeft: "auto",
    marginRight: 6,
  },
  rangeText: {
    fontSize: 14,
    color: '#888',
  },
  slider: {
    width: '100%',
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff008c',
    marginBottom: 10,
  },
  filterSection: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    color: "#ff008c",
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  applyButton: {
    backgroundColor: '#ff008c',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  resetButton: {
    backgroundColor: '#6e6d6d',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default React.memo(FilterModal);

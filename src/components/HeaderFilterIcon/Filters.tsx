import { StyleSheet, Pressable, Text } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FilterModal from '../HomeScreenComp/FilterModal';

const Filters: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [filters, setFilters] = useState<{ ageRange: number[]; religion: string; gender: string } | null>(null);

    const handleApplyFilters = useCallback((filterData: { ageRange: number[]; religion: string; gender: string }) => {
        setFilters(filterData);
    }, []);

    return (
        <>
            <Pressable
                style={({ pressed }) => [
                    styles.mainContainer,
                    {
                      backgroundColor: pressed ? '#ffe6f2' : '#fff',
                      elevation: pressed ? 5 : 3,
                      shadowOpacity: pressed ? 0.6 : 0.3,
                    },
                  ]}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="options" color="#ff008c" size={25} />
            </Pressable>

            <FilterModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onApply={handleApplyFilters}
            />
        </>
    );
};

export default React.memo(Filters);

const styles = StyleSheet.create({
    mainContainer: {
        borderRadius: 30,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#ff008c',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3.5,
    },
    filterText: {
        marginTop: 10,
        color: '#333',
        fontSize: 16,
    },
});

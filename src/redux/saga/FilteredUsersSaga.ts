import { getApp } from "@react-native-firebase/app";
import { collection, getDocs, getFirestore } from "@react-native-firebase/firestore";
import { UserProfileType } from "../../navigation/TypescriptTypes/UserType";
import { call, put, takeLatest } from "redux-saga/effects";
import { fetchUsersFailure, fetchUsersRequest, fetchUsersSuccess } from "../FilteredUsersSlice";

const db = getFirestore(getApp());

const fetchUsersFromFirebase = async (): Promise<UserProfileType[]> => {
    const usersCollection = collection(db, "usersProfiles");
    const snapshot = await getDocs(usersCollection);

    const users: UserProfileType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as UserProfileType)
    }));

    return users;
}


function* fetchUsersSaga() {
    try{
        const users:UserProfileType[] = yield call(fetchUsersFromFirebase);
        yield put(fetchUsersSuccess(users))
    }catch (error){
        yield put(fetchUsersFailure('Failed to fetch users.'));
    }
}

export function* FilteredUsersSaga(){
    yield takeLatest(fetchUsersRequest.type,fetchUsersSaga);
}
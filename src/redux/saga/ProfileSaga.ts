import axios from "axios";
import { call, put, takeLatest } from "redux-saga/effects";
import { fetchOptionsFailure, fetchOptionsStart, fetchOptionsSuccess, saveProfileFailure, saveProfileStart, saveProfileSuccess } from "../profileSlice";


const API_BASE_URL = "http://192.168.0.111:8080/api";

const fetchOptionsApi = async () => {

    try {
        const responses: PromiseSettledResult<any>[] = await Promise.allSettled([
            axios.get(`${API_BASE_URL}/get-genders`),
            axios.get(`${API_BASE_URL}/get-religions`),
            axios.get(`${API_BASE_URL}/get-languages`),
            axios.get(`${API_BASE_URL}/get-employment-statuses`),
            axios.get(`${API_BASE_URL}/get-professions`),
            axios.get(`${API_BASE_URL}/get-education-level`),
            axios.get(`${API_BASE_URL}/get-sects`),
            axios.get(`${API_BASE_URL}/get-cities`),
            axios.get(`${API_BASE_URL}/get-marital-statuses`), 
        ]);
        return {
            genders: responses[0].status === "fulfilled" ? responses[0].value.data : [],
            religions: responses[1].status === "fulfilled" ? responses[1].value.data : [],
            languages: responses[2].status === "fulfilled" ? responses[2].value.data : [],
            employmentStatuses: responses[3].status === "fulfilled" ? responses[3].value.data : [],
            professions: responses[4].status === "fulfilled" ? responses[4].value.data : [],
            educationLevels: responses[5].status === "fulfilled" ? responses[5].value.data : [],
            sects: responses[6].status === "fulfilled" ? responses[6].value.data : [],
            cities: responses[7].status === "fulfilled" ? responses[7].value.data : [],
            maritalStatuses: responses[8].status === "fulfilled" ? responses[8].value.data : [],
        };
    } catch (error) {
        console.log("Error fetching profile options:", error);

    }

}

function* fetchOptionsSaga() {
    try {
        const options = yield call(fetchOptionsApi);
        console.log("Options fetched successfuly: ", options);

        yield put(fetchOptionsSuccess(options));
    } catch (error: any) {
        console.log("Options fetching failed: ", error);
        yield put(fetchOptionsFailure(error.message));
    }
}

function* saveProfileSaga(action: any) {
    try {
        const formData = new FormData();
        Object.keys(action.payload).forEach((key) => {
            formData.append(key, action.payload[key])
        })

        const response = yield call(axios.post, `${API_BASE_URL}/create-profile`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        console.log("Profile saved successfully[ profileSaga ]:", response.data); // Debugging

        yield put(saveProfileSuccess(response.data));
    } catch (error: any) {
        console.error("Profile save failed:", error.message); // Debugging
        yield put(saveProfileFailure(error.message))
    }
}

export function* ProfileSaga() {
    yield takeLatest(fetchOptionsStart.type, fetchOptionsSaga);
    yield takeLatest(saveProfileStart.type, saveProfileSaga)
}
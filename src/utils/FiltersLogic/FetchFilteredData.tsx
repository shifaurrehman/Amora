
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import { fetchFilteredProfiles } from '../../services/supabase/profiles';

export const fetchFilteredProfilesByFilters = async (ageRange: number[], religion: string, gender: string)
  : Promise<UserProfileType[]> => {

  console.log("fetching start filtered users...");

  try {
    // Filters run server-side against the indexed discoverable columns.
    // RLS limits results to the caller's own profile plus discoverable ones.
    const filteredProfiles = await fetchFilteredProfiles(
      ageRange && ageRange.length === 2 ? ageRange : null,
      religion,
      gender,
    );
    return filteredProfiles;

  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }

}

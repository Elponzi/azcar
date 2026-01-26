import { Redirect } from 'expo-router';
import { useAzkarStore } from '@/store/azkarStore';
import { CATEGORIES } from '@/data';

export default function Index() {
  const currentCategory = useAzkarStore(state => state.currentCategory);
  // Default to stored category or first available if not present
  return <Redirect href={`/${currentCategory || CATEGORIES[0]}`} />;
}

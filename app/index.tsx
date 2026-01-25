import { Redirect } from 'expo-router';
import { useAzkarStore } from '@/store/azkarStore';

export default function Index() {
  const currentCategory = useAzkarStore(state => state.currentCategory);
  // Default to stored category or Morning if not present
  return <Redirect href={`/${currentCategory || 'Morning'}`} />;
}

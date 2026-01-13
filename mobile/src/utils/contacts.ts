import * as Contacts from 'expo-contacts';
import { ensureContactsPermission } from './permissions';

export type SimpleContact = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export const fetchContacts = async (limit = 50): Promise<SimpleContact[]> => {
  const permission = await ensureContactsPermission();
  if (!permission.granted) {
    return [];
  }

  const { data } = await Contacts.getContactsAsync({
    pageSize: limit,
    sort: Contacts.SortTypes.FirstName,
  });

  return data.map((entry) => ({
    id: entry.id,
    name: entry.name ?? 'Unknown',
    phone: entry.phoneNumbers?.[0]?.number,
    email: entry.emails?.[0]?.email,
  }));
};

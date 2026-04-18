'use client';
import AdminCompanies from '@/components/pages/admin/AdminCompanies';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminCompaniesPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminCompanies />
    </ProtectedRoute>
  );
}

import React from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { WeatherPanel } from '../features/inventory/components/WeatherPanel';
import { EmployeeRole } from '../features/inventory/types/inventory.types';
import { CustomerDashboard } from '../features/inventory/components/CustomerDashboard';
import { useTranslation } from 'react-i18next';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // customer should get the customer dashboard instead of the other employee one
  if (user?.role === EmployeeRole.Customer) {
    return <CustomerDashboard />;
  }
  
  // show the employee one if its not the customer
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-base-text">{t('dashboard.title')}</h1>
        <p className="mt-2 text-muted-text">
          {t('dashboard.welcome_back')}, <span className="font-semibold text-primary-600">{user?.name}</span>. 
          Manage your modules from the navigation below.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-card-title">{t('dashboard.inventory_summary')}</h3>
          <p className="mt-2 text-card-body mb-6">{t('dashboard.inventory_desc')}</p>
          <Link to="/inventory">
            <Button variant="primary">{t('dashboard.go_to_inventory')}</Button>
          </Link>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-card-title">{t('dashboard.warehouse_map')}</h3>
          <p className="mt-2 text-card-body mb-6">{t('dashboard.warehouse_desc')}</p>
          <Link to="/viewer">
            <Button variant="secondary">{t('dashboard.open_map')}</Button>
          </Link>
        </Card>

        {user?.role === EmployeeRole.Manager && (
          <>
            <Card>
              <h3 className="text-lg font-bold text-card-title">Staff Management</h3>
              <p className="mt-2 text-card-body mb-6">Manage employee profiles, roles, and track live task assignments.</p>
              <Link to="/admin/employees">
                <Button variant="primary">Manage Staff</Button>
              </Link>
            </Card>
            <Card>
              <h3 className="text-lg font-bold text-card-title">Customer & Payments</h3>
              <p className="mt-2 text-card-body mb-6">Manage customer relations and perform offline payment approvals.</p>
              <Link to="/admin/customers">
                <Button variant="primary">Manage Customers</Button>
              </Link>
            </Card>
          </>
        )}
      </div>

      <Card padding="lg">
        <h3 className="text-xl font-bold text-card-title mb-4">{t('dashboard.quick_stats')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{t('dashboard.total_products')}</p>
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">124</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Active Bins</p>
            <p className="text-2xl font-bold text-green-900">85%</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Pending Orders</p>
            <p className="text-2xl font-bold text-yellow-900">12</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">System Health</p>
            <p className="text-2xl font-bold text-purple-900">Optimal</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeatherPanel />
        <Card className="bg-gray-50 border-dashed border-2 border-gray-200 flex items-center justify-center">
            <p className="text-gray-400 text-sm font-medium italic">Internal System Notices</p>
        </Card>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wrench, DollarSign, Clock, CheckCircle, ShoppingCart, Users } from 'lucide-react';
import { useThemeStore, useTicketsStore, useClientsStore, useProductsStore, useAuthStore } from '../lib/store';
import { format, subDays } from 'date-fns';
import DailySalesWidget from '../components/DailySalesWidget';
import { ROLES } from '../lib/firebase';

export default function Dashboard() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { tickets } = useTicketsStore();
  const { clients } = useClientsStore();
  const { products } = useProductsStore();
  const { user, userRole } = useAuthStore();
  
  // Filter tickets based on user role
  const userTickets = useMemo(() => {
    if (userRole === ROLES.SUPER_ADMIN) {
      return tickets;
    } else if (user) {
      // For technicians, only show their assigned tickets
      return tickets.filter(ticket => ticket.technicianId === user.uid);
    }
    return [];
  }, [tickets, userRole, user]);
  
  // Calculate stats
  const pendingTickets = userTickets.filter(ticket => ticket.status === 'pending').length;
  const inProgressTickets = userTickets.filter(ticket => ticket.status === 'in-progress').length;
  const completedTickets = userTickets.filter(ticket => ticket.status === 'completed').length;
  const totalEarnings = userTickets.reduce((sum, ticket) => sum + ticket.cost, 0);
  
  // For super admin only stats
  const lowStockProducts = userRole === ROLES.SUPER_ADMIN ? 
    products.filter(product => product.stock < 5).length : 0;
  
  // Generate weekly data for the chart
  const generateWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      // For super admin, show both sales and repairs
      if (userRole === ROLES.SUPER_ADMIN) {
        return {
          name: day,
          sales: Math.floor(Math.random() * 3000) + 1000,
          repairs: Math.floor(Math.random() * 2000) + 500
        };
      } 
      // For technicians, only show their repairs
      else {
        return {
          name: day,
          repairs: Math.floor(Math.random() * 2000) + 500
        };
      }
    });
  };
  
  const weeklyData = useMemo(() => generateWeeklyData(), [userRole]);

  // Stats to display based on role
  const getStats = () => {
    const baseStats = [
      { name: 'Pending Repairs', value: pendingTickets.toString(), icon: Clock, color: 'bg-yellow-500' },
      { name: 'In Progress', value: inProgressTickets.toString(), icon: Wrench, color: 'bg-blue-500' },
      { name: 'Completed Repairs', value: completedTickets.toString(), icon: CheckCircle, color: 'bg-green-500' },
      { name: 'Total Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'bg-indigo-500' },
    ];
    
    // Add super admin specific stats
    if (userRole === ROLES.SUPER_ADMIN) {
      return [
        ...baseStats,
        { name: 'Low Stock Items', value: lowStockProducts.toString(), icon: ShoppingCart, color: 'bg-red-500' },
      ];
    }
    
    return baseStats;
  };
  
  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow p-6`}
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {stat.name}
                </p>
                <p className={`text-2xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Only show sales widget for super admin */}
      {userRole === ROLES.SUPER_ADMIN && <DailySalesWidget />}

      <div className={`rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } shadow p-6`}>
        <h2 className={`text-lg font-semibold mb-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Weekly Performance
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {userRole === ROLES.SUPER_ADMIN && (
                <Bar dataKey="sales" fill="#4F46E5" name="Sales ($)" />
              )}
              <Bar dataKey="repairs" fill="#10B981" name="Repairs ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Recent Repair Tickets
          </h2>
          <div className="space-y-4">
            {userTickets.slice(0, 5).map((ticket) => {
              const client = clients.find(c => c.id === ticket.clientId);
              return (
                <div key={ticket.id} className="flex items-start">
                  <div className={`p-2 rounded-full mr-4 ${
                    ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {client?.name} - {ticket.deviceType} {ticket.brand}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Status: {ticket.status} | ${ticket.cost}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {userTickets.length === 0 && (
              <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No tickets assigned to you yet.
              </p>
            )}
          </div>
        </div>

        {/* Only show clients for super admin */}
        {userRole === ROLES.SUPER_ADMIN ? (
          <div className={`rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow p-6`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Recent Clients
            </h2>
            <div className="space-y-4">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-start">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full mr-4">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {client.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {client.phone} | {format(new Date(client.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
              
              {clients.length === 0 && (
                <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No clients in the system yet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={`rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow p-6`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ticket Status Distribution
            </h2>
            <div className="flex justify-around items-center h-64">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-2">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {pendingTickets}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pending
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-2">
                  <Wrench className="h-8 w-8 text-blue-600" />
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {inProgressTickets}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  In Progress
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {completedTickets}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Completed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
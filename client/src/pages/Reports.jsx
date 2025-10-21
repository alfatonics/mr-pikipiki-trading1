import { useState } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { FiDownload, FiFileText } from 'react-icons/fi';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleDownloadReport = async (reportType, format = 'excel') => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format
      };

      const response = await axios.get(`/api/reports/${reportType}`, {
        params,
        responseType: format === 'excel' ? 'blob' : 'json'
      });

      if (format === 'excel') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}-report-${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Display JSON data
        console.log(response.data);
        alert('Report data logged to console');
      }
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      title: 'Sales Report',
      description: 'Comprehensive sales report with revenue and profit analysis',
      type: 'sales',
      icon: FiFileText,
      color: 'bg-green-500'
    },
    {
      title: 'Inventory Report',
      description: 'Current inventory status and stock valuation',
      type: 'inventory',
      icon: FiFileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Supplier Performance',
      description: 'Supplier analysis and performance metrics',
      type: 'suppliers',
      icon: FiFileText,
      color: 'bg-purple-500'
    },
    {
      title: 'Transport Report',
      description: 'Delivery tracking and transportation costs',
      type: 'transport',
      icon: FiFileText,
      color: 'bg-yellow-500'
    },
    {
      title: 'Repair Costs Report',
      description: 'Maintenance and repair expenses breakdown',
      type: 'repairs',
      icon: FiFileText,
      color: 'bg-red-500'
    },
    {
      title: 'Profit Report',
      description: 'Detailed profit analysis with all expenses (Admin only)',
      type: 'profit',
      icon: FiFileText,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Date Range</h2>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Input
            label="Start Date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.type} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className={`${report.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {report.description}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownloadReport(report.type, 'excel')}
                      disabled={loading}
                    >
                      <FiDownload className="inline mr-1" size={14} />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReport(report.type, 'json')}
                      disabled={loading}
                    >
                      <FiFileText className="inline mr-1" size={14} />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;



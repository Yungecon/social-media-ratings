import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import _ from 'lodash';

const ReelsRankingDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankingMetric, setRankingMetric] = useState('EngagementScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);
  const [top10Data, setTop10Data] = useState([]);
  const [selectedReel, setSelectedReel] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/Pov Husband Reels.csv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Calculate additional metrics for each reel
            const processedData = results.data.map((row, index) => {
              // Calculate engagement rate (likes + comments) / views * 100
              const engagementRate = ((row.Likes + row.Comments) / row.Views) * 100;
              
              // Calculate engagement score - weighted formula
              // This gives more weight to comments as they require more effort
              const engagementScore = (row.Likes * 1 + row.Comments * 3) / row.Views * 100;
              
              // Calculate viral coefficient - measures how viral the content is
              const viralCoefficient = Math.log10(row.Views) * engagementRate / 100;
              
              // Create a shortened URL for display purposes
              const shortUrl = row.Reel.split('/').slice(-2, -1)[0];
              
              return {
                ...row,
                id: index + 1,
                EngagementRate: engagementRate,
                EngagementScore: engagementScore,
                ViralCoefficient: viralCoefficient,
                ShortUrl: shortUrl
              };
            });
            
            setData(processedData);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error reading file:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update top10 data when ranking metric changes
  useEffect(() => {
    if (data.length > 0) {
      const newTop10 = [...data]
        .sort((a, b) => b[rankingMetric] - a[rankingMetric])
        .slice(0, 10)
        .map(reel => ({
          ...reel,
          // Create cleaner display ID for x-axis (just last 5 chars)
          DisplayUrl: reel.ShortUrl.slice(-5)
        }));
      
      setTop10Data(newTop10);
    }
  }, [data, rankingMetric]);

  // Format large numbers with K, M, B suffix
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  // Filter and sort data
  const filteredData = data
    .filter(item => 
      filterValue === '' || 
      item.Reel.toLowerCase().includes(filterValue.toLowerCase()) ||
      item.ShortUrl.toLowerCase().includes(filterValue.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[rankingMetric] - b[rankingMetric];
      } else {
        return b[rankingMetric] - a[rankingMetric];
      }
    });

  // Paginate data
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  const getMetricLabel = (metric) => {
    switch(metric) {
      case 'Views': return 'Views';
      case 'Likes': return 'Likes';
      case 'Comments': return 'Comments';
      case 'EngagementRate': return 'Engagement Rate (%)';
      case 'EngagementScore': return 'Engagement Score';
      case 'ViralCoefficient': return 'Viral Coefficient';
      default: return metric;
    }
  };

  // Handle chart clicks
  const handleChartClick = (data) => {
    if (!data || !data.activeLabel) return;
    
    const reel = top10Data.find(item => item.DisplayUrl === data.activeLabel);
    if (reel) {
      setSelectedReel(reel);
      
      // Calculate position - place tooltip near the click
      const x = data.chartX || 100;
      const y = data.chartY || 100;
      
      setTooltipPosition({ x, y });
    }
  };
  
  // Custom fixed tooltip component (completely separate from chart)
  const FixedTooltip = () => {
    if (!selectedReel) return null;
    
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setSelectedReel(null);
      }
    };
    
    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    return (
      <div 
        ref={tooltipRef}
        className="fixed bg-white p-4 border border-gray-300 shadow-lg rounded-lg"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y - 120,
          zIndex: 9999,
          minWidth: '240px',
        }}
      >
        <div className="flex justify-between mb-2">
          <h3 className="font-bold">Reel Details</h3>
          <button 
            onClick={() => setSelectedReel(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <a 
            href={selectedReel.Reel}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center"
          >
            Open Reel
          </a>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">ID:</span>
            <span className="font-medium">{selectedReel.ShortUrl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Views:</span>
            <span className="font-medium">{formatNumber(selectedReel.Views)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Likes:</span>
            <span className="font-medium">{formatNumber(selectedReel.Likes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Comments:</span>
            <span className="font-medium">{formatNumber(selectedReel.Comments)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Engagement Rate:</span>
            <span className="font-medium">{selectedReel.EngagementRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Engagement Score:</span>
            <span className="font-medium">{selectedReel.EngagementScore.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Calculate statistics
  const stats = {
    totalViews: _.sumBy(data, 'Views'),
    totalLikes: _.sumBy(data, 'Likes'),
    totalComments: _.sumBy(data, 'Comments'),
    avgEngagementRate: _.meanBy(data, 'EngagementRate'),
    avgEngagementScore: _.meanBy(data, 'EngagementScore'),
  };

  return (
    <div className="p-4 font-sans">
      {/* Fixed Tooltip */}
      <FixedTooltip />
      
      <h1 className="text-2xl font-bold mb-6">Instagram Reels Ranking Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-blue-500">Total Views</h3>
          <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-red-500">Total Likes</h3>
          <p className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-green-500">Total Comments</h3>
          <p className="text-2xl font-bold">{formatNumber(stats.totalComments)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-purple-500">Avg Engagement Rate</h3>
          <p className="text-2xl font-bold">{stats.avgEngagementRate.toFixed(2)}%</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-yellow-600">Avg Engagement Score</h3>
          <p className="text-2xl font-bold">{stats.avgEngagementScore.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 p-3 rounded-lg mb-6 text-sm text-blue-700">
        <p className="font-medium">Click on any bar or point in the charts to see detailed information and open the Reel.</p>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 10 Reels by {getMetricLabel(rankingMetric)}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={top10Data}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="DisplayUrl" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'EngagementRate' || name === 'EngagementScore' 
                    ? value.toFixed(2) 
                    : formatNumber(value), 
                  getMetricLabel(name)
                ]}
              />
              <Legend />
              <Bar dataKey={rankingMetric} fill="#8884d8" name={getMetricLabel(rankingMetric)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Engagement vs. Views</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={top10Data}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="DisplayUrl" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'EngagementScore' ? value.toFixed(2) : formatNumber(value), 
                  name === 'EngagementScore' ? 'Engagement Score' : 'Views'
                ]}
              />
              <Legend />
              <Line yAxisId="right" type="monotone" dataKey="Views" stroke="#82ca9d" activeDot={{ r: 8 }} name="Views" />
              <Line yAxisId="left" type="monotone" dataKey="EngagementScore" stroke="#8884d8" name="Engagement Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rank By</label>
          <select 
            className="border border-gray-300 rounded-md p-2"
            value={rankingMetric}
            onChange={(e) => setRankingMetric(e.target.value)}
          >
            <option value="Views">Views</option>
            <option value="Likes">Likes</option>
            <option value="Comments">Comments</option>
            <option value="EngagementRate">Engagement Rate</option>
            <option value="EngagementScore">Engagement Score</option>
            <option value="ViralCoefficient">Viral Coefficient</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <select 
            className="border border-gray-300 rounded-md p-2"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Highest First</option>
            <option value="asc">Lowest First</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
          <input 
            type="text" 
            placeholder="Search by URL..." 
            className="border border-gray-300 rounded-md p-2"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        </div>
      </div>
      
      {/* Data Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reel ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Viral Coefficient</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((reel, index) => (
              <tr key={reel.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {(page - 1) * rowsPerPage + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a 
                    href={reel.Reel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline cursor-pointer"
                    title="Click to open reel in Instagram"
                  >
                    {reel.ShortUrl}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(reel.Views)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(reel.Likes)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(reel.Comments)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reel.EngagementRate.toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reel.EngagementScore.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reel.ViralCoefficient.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{(page - 1) * rowsPerPage + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(page * rowsPerPage, filteredData.length)}
          </span>{' '}
          of <span className="font-medium">{filteredData.length}</span> results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 text-sm rounded-md ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => (p * rowsPerPage < filteredData.length ? p + 1 : p))}
            disabled={page * rowsPerPage >= filteredData.length}
            className={`px-4 py-2 text-sm rounded-md ${
              page * rowsPerPage >= filteredData.length
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReelsRankingDashboard; 
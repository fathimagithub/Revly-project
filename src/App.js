import React, { useState, useEffect } from 'react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button'; 
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const WebsitePerformanceAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({});

  useEffect(() => {
    const savedHistory = localStorage.getItem('analysisHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const analyzeWebsite = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/analyze?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }
      const data = await response.json();
      setPerformanceData(data);
      
      // Update history
      const newHistory = { ...history, [url]: [...(history[url] || []), data] };
      setHistory(newHistory);
      localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error analyzing website:', error);
      setError('Failed to analyze website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceScore = (loadTime) => {
    return Math.max(0, Math.min(100, 100 - loadTime * 10));
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getMetricColor = (metric, value) => {
    const thresholds = {
      loadTime: { good: 2, bad: 5 },
      totalSize: { good: 1000, bad: 3000 },
      requestCount: { good: 30, bad: 60 }
    };
    
    if (value <= thresholds[metric].good) return '#10B981';
    if (value <= thresholds[metric].bad) return '#F59E0B';
    return '#EF4444';
  };

  const renderPerformanceChart = () => {
    if (!performanceData) return null;

    const score = getPerformanceScore(performanceData.loadTime);
    const data = [
      { name: 'Score', value: score, fill: getScoreColor(score) },
    ];

    return (
      <RadialBarChart 
        width={200} 
        height={200} 
        cx={100} 
        cy={100} 
        innerRadius={60}
        outerRadius={80} 
        barSize={10} 
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          minAngle={15}
          background
          clockWise={true}
          dataKey="value"
        />
        <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" />
        <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Performance Score']} />
      </RadialBarChart>
    );
  };

  const renderMetric = (label, value, unit, metric) => {
    const color = getMetricColor(metric, value);
    const previousValue = history[url] && history[url][history[url].length - 2] ?
      history[url][history[url].length - 2][metric] : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-gray-700">{label}</h3>
        <p className="text-3xl font-bold" style={{ color }}>
          {value} {unit}
        </p>
        {previousValue && (
          <p className="text-sm text-gray-500">
            Previous: {previousValue} {unit}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">SpeedX Website Performance Analyzer</h1>
      <div className="flex space-x-2 mb-6">
        <Input
          type="url"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={analyzeWebsite} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {performanceData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-xl text-gray-700">Performance Results</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center">
                  {renderPerformanceChart()}
                  <p className="mt-2 text-lg font-semibold text-gray-700">Overall Score</p>
                </div>
                <div className="space-y-4">
                  {renderMetric('Page Load Time', performanceData.loadTime, 's', 'loadTime')}
                  {renderMetric('Total Request Size', performanceData.totalSize, 'KB', 'totalSize')}
                  {renderMetric('Number of Requests', performanceData.requestCount, '', 'requestCount')}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default WebsitePerformanceAnalyzer;
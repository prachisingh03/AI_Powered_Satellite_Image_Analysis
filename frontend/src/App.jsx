import React, { useState } from 'react';
import { Upload, Flame, Image as ImageIcon, Satellite, TrendingUp, Brain, Layers, BarChart3, ChevronRight, Home, Menu, X, AlertCircle } from 'lucide-react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Functions
const api = {
  predictWildfire: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/api/predict/wildfire`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Prediction failed');
    }
    
    return response.json();
  },
  
  predictSegmentation: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/api/predict/segmentation`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Segmentation failed');
    }
    
    return response.json();
  },
  
  getModelsInfo: async () => {
    const response = await fetch(`${API_BASE_URL}/api/models/info`);
    if (!response.ok) {
      throw new Error('Failed to fetch model info');
    }
    return response.json();
  }
};

// Main App Component
const SatelliteAnalysisDashboard = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'wildfire':
        return <WildfirePredictionPage />;
      case 'segmentation':
        return <ImageSegmentationPage />;
      case 'analysis':
        return <ModelAnalysisPage />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Navigation Bar */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">Satellite Image Analysis</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <NavButton icon={Home} label="Home" onClick={() => setCurrentPage('home')} active={currentPage === 'home'} />
              <NavButton icon={Flame} label="Wildfire" onClick={() => setCurrentPage('wildfire')} active={currentPage === 'wildfire'} />
              <NavButton icon={Satellite} label="Segmentation" onClick={() => setCurrentPage('segmentation')} active={currentPage === 'segmentation'} />
              <NavButton icon={BarChart3} label="Analysis" onClick={() => setCurrentPage('analysis')} active={currentPage === 'analysis'} />
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/50 backdrop-blur-lg border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <MobileNavButton icon={Home} label="Home" onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} />
              <MobileNavButton icon={Flame} label="Wildfire" onClick={() => { setCurrentPage('wildfire'); setMobileMenuOpen(false); }} />
              <MobileNavButton icon={ImageIcon} label="Segmentation" onClick={() => { setCurrentPage('segmentation'); setMobileMenuOpen(false); }} />
              <MobileNavButton icon={BarChart3} label="Analysis" onClick={() => { setCurrentPage('analysis'); setMobileMenuOpen(false); }} />
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <div className="min-h-[calc(100vh-4rem)]">
        {renderPage()}
      </div>
    </div>
  );
};

// Navigation Components
const NavButton = ({ icon: Icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
      active 
        ? 'bg-purple-600 text-white' 
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavButton = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-3 w-full px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

// Alert Component
const Alert = ({ type, message, onClose }) => {
  const styles = {
    error: 'bg-red-500/20 border-red-500/50 text-red-200',
    success: 'bg-green-500/20 border-green-500/50 text-green-200',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
  };

  return (
    <div className={`${styles[type]} border rounded-xl p-4 mb-4 flex items-center justify-between`}>
      <div className="flex items-center space-x-3">
        <AlertCircle className="w-5 h-5" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Home Page
const HomePage = ({ setCurrentPage }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Satellite Image Analysis
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Advanced AI-powered platform for wildfire prediction and satellite image segmentation using state-of-the-art deep learning models
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <FeatureCard
          icon={Flame}
          title="Wildfire Prediction"
          description="Detect potential wildfire areas with 93.51% accuracy using EfficientNetB3 deep learning model"
          gradient="from-orange-500 to-red-600"
          stats={[
            { label: "Accuracy", value: "93.51%" },
            { label: "AUC Score", value: "98.53%" },
            { label: "Model", value: "EfficientNetB3" }
          ]}
          onClick={() => setCurrentPage('wildfire')}
        />
        
        <FeatureCard
          icon={Satellite}
          title="Satellite Image Segmentation"
          description="Segment satellite images into multiple classes: buildings, land, roads, vegetation, and water bodies"
          gradient="from-blue-500 to-cyan-600"
          stats={[
            { label: "Classes", value: "6" },
            { label: "Resolution", value: "(256, 256)" },
            { label: "Format", value: "RGB" }
          ]}
          onClick={() => setCurrentPage('segmentation')}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard label="Training Images" value="42.9K" icon={ImageIcon} />
        <StatCard label="Model Accuracy" value="93.51%" icon={TrendingUp} />
        <StatCard label="AUC Score" value="98.53%" icon={BarChart3} />
        <StatCard label="Classes" value="6" icon={Layers} />
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <button
          onClick={() => setCurrentPage('analysis')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto"
        >
          <Brain className="w-6 h-6" />
          <span>Explore Model Analysis</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, gradient, stats, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all cursor-pointer group hover:scale-105 transform duration-300"
  >
    <div className={`bg-gradient-to-r ${gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-300 mb-6">{description}</p>
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="text-center">
          <div className="text-xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
    <div className="mt-6 flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
      <span className="font-semibold">Get Started</span>
      <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
    <Icon className="w-8 h-8 text-purple-400 mb-3" />
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

// Wildfire Prediction Page
const WildfirePredictionPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setPrediction(null);
      setError(null);
    }
  };

  const handlePredict = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.predictWildfire(image);
      setPrediction(result.prediction);
    } catch (err) {
      setError(err.message || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Flame className="w-12 h-12 text-orange-500" />
          <h1 className="text-4xl font-bold text-white">Wildfire Prediction</h1>
        </div>
        <p className="text-gray-300 text-lg">Upload a satellite image to predict wildfire risk</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Upload Image</h3>
          
          <label className="block border-2 border-dashed border-purple-500/50 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 transition-all hover:bg-white/5">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Click to upload or drag and drop</p>
            <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
          </label>

          {preview && (
            <div className="mt-6">
              <p className="text-white font-semibold mb-3">Preview:</p>
              <img src={preview} alt="Preview" className="w-full rounded-xl border border-white/20" />
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={!image || loading}
            className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all ${
              !image || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105'
            }`}
          >
            {loading ? 'Analyzing...' : 'Predict Wildfire Risk'}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Prediction Results</h3>
          
          {!prediction && !loading && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Upload an image and click predict to see results</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-white">Analyzing image...</p>
              </div>
            </div>
          )}

          {prediction && (
            <div className="space-y-6">
              <div className={`p-6 rounded-xl ${
                prediction.class === 'Wildfire' 
                  ? 'bg-red-500/20 border border-red-500/50' 
                  : 'bg-green-500/20 border border-green-500/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-xl font-bold">Classification:</span>
                  <span className={`text-2xl font-bold ${
                    prediction.class === 'Wildfire' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {prediction.class}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Confidence:</span>
                  <span className="text-white font-bold">{(prediction.confidence * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-semibold">Class Probabilities:</h4>
                <div className="space-y-2">
                  <ProbabilityBar label="Wildfire" value={prediction.probabilities.wildfire} color="red" />
                  <ProbabilityBar label="No Wildfire" value={prediction.probabilities.no_wildfire} color="green" />
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Model:</strong> EfficientNetB3 trained on 42.9K images
                  <br />
                  <strong className="text-white">Accuracy:</strong> 93.51% | <strong className="text-white">AUC:</strong> 98.53%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProbabilityBar = ({ label, value, color }) => {
  const percentage = (value * 100).toFixed(2);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="text-white text-sm font-semibold">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${
            color === 'red' ? 'from-orange-500 to-red-600' : 'from-green-500 to-emerald-600'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Image Segmentation Page  
const ImageSegmentationPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [segmented, setSegmented] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const labels = [
    { name: 'Water', color: '#3C1098', icon: '' },
    { name: 'Land', color: '#8429F6', icon: '' },
    { name: 'Road', color: '#6EC1E4', icon: '' },
    { name: 'Vegetation', color: '#FEDD3A', icon: '' },
    { name: 'Building', color: '#E2A929', icon: '' },
    { name: 'Unlabeled', color: '#9B9B9B', icon: '' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setSegmented(null);
      setStatistics(null);
      setError(null);
    }
  };

  const handleSegment = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.predictSegmentation(image);
      setSegmented(result.segmented_image);
      setStatistics(result.class_statistics);
    } catch (err) {
      setError(err.message || 'Segmentation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <ImageIcon className="w-12 h-12 text-cyan-500" />
          <h1 className="text-4xl font-bold text-white">Satellite Image Segmentation</h1>
        </div>
        <p className="text-gray-300 text-lg">Segment satellite images into different land cover classes</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Legend */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Segmentation Classes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {labels.map((label, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded-lg border-2 border-white/30"
                style={{ backgroundColor: label.color }}
              ></div>
              <span className="text-white text-sm">{label.icon} {label.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Source Image */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Source Image</h3>
          
          <label className="block border-2 border-dashed border-cyan-500/50 rounded-xl p-12 text-center cursor-pointer hover:border-cyan-500 transition-all hover:bg-white/5">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Click to upload or drag and drop</p>
            <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
          </label>

          {preview && (
            <div className="mt-6">
              <p className="text-white font-semibold mb-3">Uploaded Image:</p>
              <img src={preview} alt="Source" className="w-full rounded-xl border border-white/20" />
            </div>
          )}

          <button
            onClick={handleSegment}
            disabled={!image || loading}
            className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all ${
              !image || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105'
            }`}
          >
            {loading ? 'Segmenting...' : 'Segment Image'}
          </button>
        </div>

        {/* Segmented Output */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Segmented Output</h3>
          
          {!segmented && !loading && (
            <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-600 rounded-xl text-gray-400">
              <div className="text-center">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Upload an image and click segment to see results</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-white">Processing segmentation...</p>
              </div>
            </div>
          )}

          {segmented && (
            <div>
              <p className="text-white font-semibold mb-3">Segmented Result:</p>
              <img src={segmented} alt="Segmented" className="w-full rounded-xl border border-white/20 mb-4" />
              
              {statistics && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                  <h4 className="text-white font-semibold mb-3">Class Distribution:</h4>
                  <div className="space-y-2">
                    {Object.entries(statistics).map(([name, data]) => (
                      <div key={name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: data.color }}
                          ></div>
                          <span className="text-gray-300">{name}</span>
                        </div>
                        <span className="text-white font-semibold">{data.percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Model:</strong> U-Net with ResNet50 backbone
                  <br />
                  <strong className="text-white">Classes:</strong> 6 (Building, Land, Road, Vegetation, Water, Unlabeled)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ModelAnalysisPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <BarChart3 className="w-12 h-12 text-purple-500" />
          <h1 className="text-4xl font-bold text-white">Model Analysis</h1>
        </div>
        <p className="text-gray-300 text-lg">Detailed insights into model architecture and performance</p>
      </div>

      {/* Wildfire Model */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Flame className="w-8 h-8 mr-3 text-orange-500" />
          Wildfire Prediction Model
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <InfoCard
            title="Model Architecture"
            items={[
              { label: 'Base Model', value: 'EfficientNetB3' },
              { label: 'Pre-training', value: 'ImageNet' },
              { label: 'Input Size', value: '(224, 224, 3)' },
              { label: 'Parameters', value: '~12M' },
              { label: 'Output', value: 'Binary (Wildfire/No Wildfire)' }
            ]}
          />
          
          <InfoCard
            title="Training Configuration"
            items={[
              { label: 'Optimizer', value: 'Adam' },
              { label: 'Learning Rate', value: '1e-5 → 0.00001' },
              { label: 'Batch Size', value: '32' },
              { label: 'Epochs', value: '15 (2-phase training)' },
              { label: 'Loss Function', value: 'Binary Crossentropy' }
            ]}
          />
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MetricCard label="Accuracy" value="93.51%" color="purple" />
          <MetricCard label="AUC Score" value="98.53%" color="blue" />
          <MetricCard label="Precision" value="96.2%" color="green" />
          <MetricCard label="Recall" value="92.8%" color="orange" />
        </div>
      </div>

      {/* Segmentation Model */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <ImageIcon className="w-8 h-8 mr-3 text-cyan-500" />
          Image Segmentation Model
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <InfoCard
            title="Model Architecture"
            items={[
              { label: 'Architecture', value: 'U-Net' },
              { label: 'Backbone', value: 'ResNet50' },
              { label: 'Input Size', value: '(256, 256, 3)' },
              { label: 'Output Classes', value: '6' },
              { label: 'Activation', value: 'Softmax' }
            ]}
          />
          
          <InfoCard
            title="Training Configuration"
            items={[
              // { label: 'Total Images', value: '42,850' },
              // { label: 'Training', value: '~70% (30,000)' },
              // { label: 'Validation', value: '~15% (6,400)' },
              // { label: 'Test', value: '~15% (6,450)' },
              // { label: 'Image Format', value: 'RGB' }
              { label: 'Loss Function', value: 'Dice_loss, Focal_loss' },
              { label: 'Optimizer', value: 'Adam' },
              { label: 'Total Images', value: '945' },
              { label: 'Batch Size', value: '16' },
              { label: 'Epochs', value: '50' }
            ]}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-4">Segmentation Classes</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Water', color: '#3C1098', desc: 'Residential and commercial structures' },
              { name: 'Land', color: '#8429F6', desc: 'Bare land and soil' },
              { name: 'Road', color: '#6EC1E4', desc: 'Paved roads and highways' },
              { name: 'Vegetation', color: '#FEDD3A', desc: 'Trees, grass, and plants' },
              { name: 'Building', color: '#E2A929', desc: 'Rivers, lakes, and water bodies' },
              { name: 'Unlabeled', color: '#9B9B9B', desc: 'Unclassified areas' }
            ].map((cls, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-white/30"
                    style={{ backgroundColor: cls.color }}
                  ></div>
                  <span className="text-white font-semibold">{cls.name}</span>
                </div>
                <p className="text-gray-400 text-sm">{cls.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, items }) => (
  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
    <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <span className="text-gray-400">{item.label}:</span>
          <span className="text-white font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const MetricCard = ({ label, value, color }) => {
  const colors = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500'
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
      <div className={`text-4xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent mb-2`}>
        {value}
      </div>
      <div className="text-gray-400 font-medium">{label}</div>
    </div>
  );
};

export default SatelliteAnalysisDashboard;
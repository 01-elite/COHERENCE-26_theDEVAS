const District = require('../models/District');
const Budget = require('../models/Budget');
const Anomaly = require('../models/Anomaly');

// @desc    Get all districts
// @route   GET /api/districts
// @access  Private
exports.getDistricts = async (req, res, next) => {
  try {
    const { state } = req.query;
    const filter = {};

    if (state) filter.state = state;

    const districts = await District.find(filter).sort({ state: 1, name: 1 });

    res.json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get district by ID
// @route   GET /api/districts/:id
// @access  Private
exports.getDistrictById = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    // Get budgets for this district
    const budgets = await Budget.find({ district: district.name })
      .populate('department', 'name code');

    res.json({
      success: true,
      data: {
        district,
        budgets
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get map data for visualization
// @route   GET /api/districts/map-data
// @access  Private
exports.getMapData = async (req, res, next) => {
  try {
    const districts = await District.find();

    // Filter and map data, ensuring valid coordinates
    const mapData = districts
      .filter(district => {
        // Only include districts with valid coordinates
        return district.coordinates && 
               typeof district.coordinates.latitude === 'number' && 
               typeof district.coordinates.longitude === 'number' &&
               !isNaN(district.coordinates.latitude) &&
               !isNaN(district.coordinates.longitude) &&
               Math.abs(district.coordinates.latitude) <= 90 &&
               Math.abs(district.coordinates.longitude) <= 180;
      })
      .map(district => ({
        id: district._id,
        name: district.name,
        state: district.state,
        coordinates: {
          latitude: parseFloat(district.coordinates.latitude) || 0,
          longitude: parseFloat(district.coordinates.longitude) || 0
        },
        totalBudgetAllocated: district.totalBudgetAllocated || 0,
        totalBudgetSpent: district.totalBudgetSpent || 0,
        utilization: parseFloat(district.utilization) || 0,
        anomalyCount: district.anomalyCount || 0,
        riskScore: district.riskScore || 0,
        population: district.population || 0
      }));

    res.json({
      success: true,
      count: mapData.length,
      data: mapData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private
exports.updateDistrict = async (req, res, next) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.json({
      success: true,
      message: 'District updated successfully',
      data: district
    });
  } catch (error) {
    next(error);
  }
};

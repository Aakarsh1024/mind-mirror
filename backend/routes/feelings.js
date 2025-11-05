const express = require('express');
const multer = require('multer');
const path = require('path');
const Feeling = require('../models/Feeling');
const { protect } = require('../middleware/auth');

const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });


const generateAIResponse = (moodType, feelingText) => {
  const responses = {
    happy: [
      "It's wonderful to see you're feeling happy! Keep spreading that positivity.",
      "Your happiness is contagious! Remember these moments when things get tough.",
      "Joy is a powerful emotion. Cherish this feeling and let it guide your day."
    ],
    sad: [
      "Take a deep breath; everything will be okay. It's okay to feel sad sometimes.",
      "I'm sorry you're feeling down. Remember that tough times don't last, but strong people do.",
      "Sadness is a part of life. Be gentle with yourself and know that brighter days are ahead."
    ],
    angry: [
      "I understand you're feeling angry. Take a moment to breathe and collect your thoughts.",
      "Anger is a natural emotion. Try channeling it into something productive or take a walk.",
      "Your feelings are valid. Consider what's causing this anger and how you can address it constructively."
    ],
    anxious: [
      "I hear you're feeling anxious. Try focusing on your breathing for a few minutes.",
      "Anxiety can be overwhelming. Remember that you've overcome challenges before and you will again.",
      "Take one moment at a time. You don't have to solve everything at once."
    ],
    excited: [
      "Your excitement is wonderful! Enjoy this feeling and let it motivate you.",
      "It's great to see you so energized! Channel this excitement into something meaningful.",
      "Excitement is a powerful emotion. Use this energy to pursue your goals."
    ],
    neutral: [
      "Sometimes feeling neutral is perfectly fine. It gives you a moment of peace.",
      "A calm state of mind can be refreshing. What would you like to do with this moment?",
      "Neutral feelings can be a good foundation. What emotion would you like to cultivate today?"
    ]
  };

  const moodResponses = responses[moodType] || responses.neutral;
  return moodResponses[Math.floor(Math.random() * moodResponses.length)];
};


router.post('/', protect, upload.fields([
  { name: 'voice', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { feelingText, moodType, gratitude } = req.body;
    
    
    const aiResponse = generateAIResponse(moodType, feelingText);
    
    
    const feelingData = {
      userId: req.user._id,
      feelingText,
      moodType,
      gratitude,
      aiResponse
    };
    
   
    if (req.files.voice) {
      feelingData.voiceLink = `/uploads/${req.files.voice[0].filename}`;
    }
    
    if (req.files.video) {
      feelingData.videoLink = `/uploads/${req.files.video[0].filename}`;
    }
    
    const feeling = await Feeling.create(feelingData);
    
    res.status(201).json(feeling);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/', protect, async (req, res) => {
  try {
    const feelings = await Feeling.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(feelings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Feeling.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$moodType',
          count: { $sum: 1 }
        }
      }
    ]);
    
  
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const weekStats = await Feeling.find({
      userId: req.user._id,
      date: { $gte: lastWeek }
    }).sort({ date: 1 });
    
    res.json({
      moodCounts: stats,
      weekTrends: weekStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put('/:id', protect, async (req, res) => {
  try {
    const feeling = await Feeling.findById(req.params.id);
    
    if (!feeling) {
      return res.status(404).json({ message: 'Feeling not found' });
    }
    
   
    if (feeling.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const updatedFeeling = await Feeling.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedFeeling);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a feeling
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { feelingText, moodType, gratitude } = req.body;

    // Check if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid feeling ID format' });
    }

    // Find the feeling by ID and ensure it belongs to the current user
    const feeling = await Feeling.findOne({ _id: id, userId: req.user._id });

    if (!feeling) {
      return res.status(404).json({ message: 'Feeling not found or you do not have permission to edit it' });
    }

    // Generate a new AI response based on the updated mood and text
    const newAiResponse = generateAIResponse(moodType, feelingText);

    // Update the feeling with new data
    const updatedFeeling = await Feeling.findByIdAndUpdate(
      id,
      {
        feelingText,
        moodType,
        gratitude,
        aiResponse: newAiResponse
      },
      { new: true } // This option returns the updated document
    );

    res.json(updatedFeeling);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error while updating feeling' });
  }
});
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid feeling ID format' });
    }

    // Find the feeling by ID and also ensure it belongs to the current user
    const feeling = await Feeling.findOne({ _id: id, userId: req.user._id });

    if (!feeling) {
      return res.status(404).json({ message: 'Feeling not found or you do not have permission to delete it' });
    }

    // Use findByIdAndDelete for a more direct approach
    await Feeling.findByIdAndDelete(id);

    res.json({ message: 'Feeling removed successfully' });
  } catch (error) {
    console.error('Delete Error:', error); // Log the full error object
    res.status(500).json({ message: 'Server error while deleting feeling', error: error.message });
  }
});

module.exports = router;
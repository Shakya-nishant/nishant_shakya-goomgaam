const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Trek = require("../models/Trek");
const { protect } = require("../middleware/authMiddleware");

router.get("/me", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const treks = await Trek.find({ user: userId });
    let rewardPoints = 0;
    let totalPosts = treks.length;
    let totalPhotos = 0;
    treks.forEach((trek) => {
      rewardPoints += 20;
      rewardPoints += (trek.photos?.length || 0) * 5;
      if (trek.routePoints?.length || trek.difficulty || trek.travelTips)
        rewardPoints += 10;
      if (trek.routePoints?.length > 1) {
        for (let i = 0; i < trek.routePoints.length - 1; i++) {
          const from = trek.routePoints[i];
          const to = trek.routePoints[i + 1];
          const distanceKm = getDistanceFromLatLonInKm(
            from.lat,
            from.lng,
            to.lat,
            to.lng,
          );
          rewardPoints += distanceKm * 5;
        }
      }
      if (trek.difficulty === "Easy") rewardPoints += 30;
      else if (trek.difficulty === "Moderate") rewardPoints += 50;
      else if (trek.difficulty === "Hard") rewardPoints += 80;
      totalPhotos += trek.photos?.length || 0;
    });
    const allUsers = await User.find();
    const leaderboard = [];
    for (const user of allUsers) {
      const userTreks = await Trek.find({ user: user._id });
      let userPoints = 0;
      userTreks.forEach((trek) => {
        userPoints += 20;
        userPoints += (trek.photos?.length || 0) * 5;
        if (trek.routePoints?.length || trek.difficulty || trek.travelTips)
          userPoints += 10;
        if (trek.routePoints?.length > 1) {
          for (let i = 0; i < trek.routePoints.length - 1; i++) {
            const from = trek.routePoints[i];
            const to = trek.routePoints[i + 1];
            const distanceKm = getDistanceFromLatLonInKm(
              from.lat,
              from.lng,
              to.lat,
              to.lng,
            );
            userPoints += distanceKm * 5;
          }
        }
        if (trek.difficulty === "Easy") userPoints += 30;
        else if (trek.difficulty === "Moderate") userPoints += 50;
        else if (trek.difficulty === "Hard") userPoints += 80;
      });
      leaderboard.push({ userId: user._id.toString(), points: userPoints });
    }
    leaderboard.sort((a, b) => b.points - a.points);
    const rank =
      leaderboard.findIndex((u) => u.userId === userId.toString()) + 1;
    res.json({
      rewardPoints: Math.round(rewardPoints),
      totalPosts,
      totalPhotos,
      leaderboardRank: rank,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

router.get("/leaderboard", protect, async (req, res) => {
  try {
    const allUsers = await User.find();
    const leaderboard = [];
    for (const user of allUsers) {
      const userTreks = await Trek.find({ user: user._id });
      let userPoints = 0;
      userTreks.forEach((trek) => {
        userPoints += 20;
        userPoints += (trek.photos?.length || 0) * 5;
        if (trek.routePoints?.length || trek.difficulty || trek.travelTips)
          userPoints += 10;
        if (trek.routePoints?.length > 1) {
          for (let i = 0; i < trek.routePoints.length - 1; i++) {
            const from = trek.routePoints[i];
            const to = trek.routePoints[i + 1];
            const distanceKm = getDistanceFromLatLonInKm(
              from.lat,
              from.lng,
              to.lat,
              to.lng,
            );
            userPoints += distanceKm * 5;
          }
        }
        if (trek.difficulty === "Easy") userPoints += 30;
        else if (trek.difficulty === "Moderate") userPoints += 50;
        else if (trek.difficulty === "Hard") userPoints += 80;
      });
      leaderboard.push({
        userId: user._id,
        name: user.name,
        profilePic: user.profilePic,
        points: Math.round(userPoints),
      });
    }
    leaderboard.sort((a, b) => b.points - a.points);
    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:id", protect, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    const stats = await calculateUserReward(userId);

    const allUsers = await User.find();
    const leaderboard = [];
    for (const u of allUsers) {
      const uStats = await calculateUserReward(u._id);
      leaderboard.push({
        userId: u._id.toString(),
        points: uStats.rewardPoints,
      });
    }
    leaderboard.sort((a, b) => b.points - a.points);
    const rank =
      leaderboard.findIndex((u) => u.userId === userId.toString()) + 1;
    res.json({
      user,
      rewardPoints: stats.rewardPoints,
      leaderboardRank: rank || "-",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reward" });
  }
});

const calculateUserReward = async (userId) => {
  try {
    const treks = await Trek.find({ user: userId });
    let rewardPoints = 0;
    let totalPosts = treks.length;
    let totalPhotos = 0;
    treks.forEach((trek) => {
      rewardPoints += 20;
      rewardPoints += (trek.photos?.length || 0) * 5;
      if (trek.routePoints?.length || trek.difficulty || trek.travelTips) {
        rewardPoints += 10;
      }
      if (trek.routePoints?.length > 1) {
        for (let i = 0; i < trek.routePoints.length - 1; i++) {
          const from = trek.routePoints[i];
          const to = trek.routePoints[i + 1];
          const distanceKm = getDistanceFromLatLonInKm(
            from.lat,
            from.lng,
            to.lat,
            to.lng,
          );
          rewardPoints += distanceKm * 5;
        }
      }
      if (trek.difficulty === "Easy") rewardPoints += 30;
      else if (trek.difficulty === "Moderate") rewardPoints += 50;
      else if (trek.difficulty === "Hard") rewardPoints += 80;

      totalPhotos += trek.photos?.length || 0;
    });

    return {
      rewardPoints: Math.round(rewardPoints),
      totalPosts,
      totalPhotos,
    };
  } catch (err) {
    console.error("calculateUserReward error:", err);
    return { rewardPoints: 0, totalPosts: 0, totalPhotos: 0 };
  }
};

module.exports = router;

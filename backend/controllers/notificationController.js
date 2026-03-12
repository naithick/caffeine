/**
 * notificationController.js — Persistent user notifications.
 */

const supabase = require("../config/supabaseClient");

/**
 * GET /api/notifications/:userId
 *
 * Fetch notifications for a user (most recent first, max 50).
 */
async function getNotifications(req, res) {
  try {
    const { userId } = req.params;
    const unreadOnly = req.query.unread === "true";

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Notifications fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ notifications: data });
  } catch (error) {
    console.error("❌ getNotifications failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/notifications
 *
 * Create a notification for a user.
 */
async function createNotification(req, res) {
  try {
    const { user_id, message, type, link } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({
        error: "user_id and message are required",
      });
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        message,
        type: type || "info",
        link: link || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Notification insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ notification: data });
  } catch (error) {
    console.error("❌ createNotification failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/notifications/:id/read
 *
 * Mark a notification as read.
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Notification update error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ notification: data });
  } catch (error) {
    console.error("❌ markAsRead failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/notifications/:id
 *
 * Delete/dismiss a notification.
 */
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Notification delete error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("❌ deleteNotification failed:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getNotifications, createNotification, markAsRead, deleteNotification };

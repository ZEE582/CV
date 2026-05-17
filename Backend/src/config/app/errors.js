/**
 * @fileoverview Error Handlers
 * @description Registers 404 and global error handlers.
 *
 * @module config/app/errors
 */

export default function setupErrors(app) {
  app.use((_req, res) => {
    res.status(404).json({
      message: "المسار غير موجود",
    });
  });

  app.use((err, _req, res, _next) => {
    console.error(
      "Global Error:",
      err.message
    );

    res.status(err.status || 500).json({
      message:
        err.message ||
        "حدث خطأ في السيرفر",
    });
  });
}
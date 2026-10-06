export const success = (res, data = null, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

export const created = (res, data = null, message = "Created") =>
  success(res, data, message, 201);

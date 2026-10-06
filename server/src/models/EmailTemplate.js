import mongoose from "mongoose";

const emailTemplateSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      category: {
        type: String,
        default: "general",
        trim: true,
      },

      subject: {
        type: String,
        required: true,
        trim: true,
      },

      html: {
        type: String,
        required: true,
      },

      enabled: {
        type: Boolean,
        default: true,
      },

      variables: {
        type: [String],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

const EmailTemplate =
  mongoose.models.EmailTemplate ||
  mongoose.model(
    "EmailTemplate",
    emailTemplateSchema
  );

export default EmailTemplate;
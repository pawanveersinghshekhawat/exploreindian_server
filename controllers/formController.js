// controllers/formController.js
import Form from "../models/Form.js";

export const createForm = async (req, res) => {
  try {
    const formData = new Form({
      name: req.body.name,
      message: req.body.description,        // ✅ Fixed: description -> message
      phone_no: req.body.phone_no,
      location: req.body.location || '',
      city: req.body.city,
      state: req.body.state || '',
      owner: req.body.owner,
      user_email: req.body.user_email,
      user_name: req.body.user_name
    });

    const form = await formData.save();
    res.status(201).json({ 
      message: "✅ Ad posted successfully! Admin aapse contact karega jald hi.",
      form 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getForms = async (req, res) => {
  try {
    const forms = await Form.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json({ forms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id).populate("owner", "name email");
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json({ form });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFormStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("owner", "name email");
    
    res.json({ 
      message: "Form status updated successfully", 
      form 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

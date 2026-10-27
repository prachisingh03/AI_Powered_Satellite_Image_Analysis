from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
from PIL import Image
import io
import base64
from keras.layers import TFSMLayer
from keras import Model, Input

from typing import Dict, Any
import uvicorn
import tensorflow.keras.backend as K

def jaccard_coef(y_true, y_pred):
  y_true_flatten = K.flatten(y_true)
  y_pred_flatten = K.flatten(y_pred)
  intersection = K.sum(y_true_flatten*y_pred_flatten)
  final_coef_value = (intersection + 1.0) / (K.sum(y_true_flatten)+ K.sum(y_pred_flatten) - intersection + 1.0)
  return final_coef_value

weights = [0.1666, 0.1666, 0.1666, 0.1666, 0.1666, 0.1666]

def dice_loss_weighted(y_true, y_pred, weights=weights, smooth=1e-6):
    # Flatten
    y_true_f = tf.keras.backend.flatten(y_true)
    y_pred_f = tf.keras.backend.flatten(y_pred)

    # Compute Dice per class
    intersection = tf.reduce_sum(y_true_f * y_pred_f, axis=0)
    union = tf.reduce_sum(y_true_f, axis=0) + tf.reduce_sum(y_pred_f, axis=0)

    dice_per_class = (2.0 * intersection + smooth) / (union + smooth)

    # Weighted average
    return 1.0 - tf.reduce_sum(dice_per_class * weights)

def categorical_focal_loss(y_true, y_pred, gamma=2.0, alpha=0.25):
    y_pred = tf.keras.backend.clip(y_pred, tf.keras.backend.epsilon(), 1 - tf.keras.backend.epsilon())
    cross_entropy = -y_true * tf.math.log(y_pred)
    weight = alpha * tf.keras.backend.pow(1 - y_pred, gamma)
    loss = weight * cross_entropy
    return tf.keras.backend.sum(loss, axis=-1)


def total_loss(y_true, y_pred):
    return dice_loss_weighted(y_true, y_pred) + categorical_focal_loss(y_true, y_pred)


# Initialize FastAPI app
app = FastAPI(
    title="Satellite Image Analysis API",
    description="API for wildfire prediction and satellite image segmentation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
wildfire_model = None
segmentation_model = None

# Model paths
WILDFIRE_MODEL_PATH = "models/wildfire_model_serving"
SEGMENTATION_MODEL_PATH = "models/segmentation_model_fixed.keras"

# Configuration
WILDFIRE_IMG_SIZE = 224
SEGMENTATION_IMG_SIZE = 256
CLASS_NAMES = {0: "No Wildfire", 1: "Wildfire"}
SEGMENTATION_CLASSES = {
    0: {"name": "Water", "color": "#3C1098"},
    1: {"name": "Land", "color": "#8429F6"},
    2: {"name": "Road", "color": "#6EC1E4"},
    3: {"name": "Vegetation", "color": "#FEDD3A"},
    4: {"name": "Building", "color": "#E2A929"},
    5: {"name": "Unlabeled", "color": "#9B9B9B"}
}


@app.on_event("startup")
async def load_models():
    """Load models on startup"""
    global wildfire_model, segmentation_model
    
    try:
        print("Loading wildfire prediction model...")

        # Load SavedModel as inference-only layer
        wildfire_layer = TFSMLayer(
            WILDFIRE_MODEL_PATH,
            call_endpoint="serve"   # <-- from Colab log
        )

        # Wrap into a Keras Model
        inputs = Input(shape=(224, 224, 3))
        outputs = wildfire_layer(inputs)

        wildfire_model = Model(inputs, outputs)

        print("✓ Wildfire model loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load wildfire model: {e}")
    
    try:
        print("Loading segmentation model...")
        segmentation_model = load_model(SEGMENTATION_MODEL_PATH, custom_objects={
            "dice_loss_weighted": dice_loss_weighted,
            "categorical_focal_loss": categorical_focal_loss,
            "total_loss": total_loss,
            'jaccard_coef': jaccard_coef
        })
        print("✓ Segmentation model loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load segmentation model: {e}")


def preprocess_wildfire_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess image for wildfire prediction
    (IDENTICAL to training / Colab pipeline)
    """

    # Ensure RGB
    image = image.convert("RGB")

    # Resize
    image = image.resize((WILDFIRE_IMG_SIZE, WILDFIRE_IMG_SIZE))

    # Convert to NumPy
    img_array = np.array(image).astype(np.float32)

    # EfficientNet preprocessing (IMPORTANT)
    img_array = preprocess_input(img_array)

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


def preprocess_segmentation_image(image: Image.Image) -> np.ndarray:
    """Preprocess image for segmentation"""
    # Resize image
    image = image.resize((SEGMENTATION_IMG_SIZE, SEGMENTATION_IMG_SIZE))
    
    # Convert to array
    img_array = np.array(image)
    
    # Ensure RGB
    if len(img_array.shape) == 2:
        img_array = np.stack([img_array] * 3, axis=-1)
    elif img_array.shape[-1] == 4:
        img_array = img_array[:, :, :3]
    
    # Normalize
    img_array = img_array / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


def create_segmentation_mask(predictions: np.ndarray) -> Image.Image:
    """Convert segmentation predictions to colored mask"""
    # Get class predictions
    mask = np.argmax(predictions[0], axis=-1)
    
    # Create RGB image
    height, width = mask.shape
    colored_mask = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Color each class
    for class_id, class_info in SEGMENTATION_CLASSES.items():
        color_hex = class_info["color"]
        color_rgb = tuple(int(color_hex[i:i+2], 16) for i in (1, 3, 5))
        colored_mask[mask == class_id] = color_rgb
    
    return Image.fromarray(colored_mask)


def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Satellite Image Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "wildfire_prediction": "/api/predict/wildfire",
            "segmentation": "/api/predict/segmentation",
            "model_info": "/api/models/info",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "wildfire_model_loaded": wildfire_model is not None,
        "segmentation_model_loaded": segmentation_model is not None
    }


@app.post("/api/predict/wildfire")
async def predict_wildfire(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Predict wildfire risk from satellite image
    
    Args:
        file: Image file (PNG, JPG, JPEG)
    
    Returns:
        Prediction results with class, confidence, and probabilities
    """
    if wildfire_model is None:
        raise HTTPException(status_code=503, detail="Wildfire model not loaded")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess
        processed_image = preprocess_wildfire_image(image)
        
        # Predict
        prediction = wildfire_model.predict(processed_image, verbose=0)
        probability = float(prediction[0][0])
        
        # Determine class
        predicted_class = 1 if probability > 0.4 else 0
        class_name = CLASS_NAMES[predicted_class]
        confidence = probability if predicted_class == 1 else (1 - probability)
        
        return {
            "success": True,
            "prediction": {
                "class": class_name,
                "class_id": predicted_class,
                "confidence": float(confidence),
                "probabilities": {
                    "wildfire": float(probability),
                    "no_wildfire": float(1 - probability)
                }
            },
            "model_info": {
                "model": "EfficientNetB3",
                "accuracy": 0.9351,
                "auc": 0.9853
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/api/predict/segmentation")
async def predict_segmentation(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Segment satellite image into different classes
    
    Args:
        file: Image file (PNG, JPG, JPEG)
    
    Returns:
        Segmented image as base64 string with class statistics
    """
    if segmentation_model is None:
        raise HTTPException(status_code=503, detail="Segmentation model not loaded")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess
        processed_image = preprocess_segmentation_image(image)
        
        # Predict
        predictions = segmentation_model.predict(processed_image, verbose=0)
        
        # Create colored mask
        segmented_image = create_segmentation_mask(predictions)
        
        # Get class statistics
        mask = np.argmax(predictions[0], axis=-1)
        total_pixels = mask.size
        class_stats = {}
        
        for class_id, class_info in SEGMENTATION_CLASSES.items():
            pixel_count = np.sum(mask == class_id)
            percentage = (pixel_count / total_pixels) * 100
            class_stats[class_info["name"]] = {
                "pixels": int(pixel_count),
                "percentage": float(percentage),
                "color": class_info["color"]
            }
        
        # Convert to base64
        segmented_base64 = image_to_base64(segmented_image)
        
        return {
            "success": True,
            "segmented_image": f"data:image/png;base64,{segmented_base64}",
            "class_statistics": class_stats,
            "model_info": {
                "model": "U-Net with ResNet50",
                "classes": 6,
                "input_size": f"{SEGMENTATION_IMG_SIZE}x{SEGMENTATION_IMG_SIZE}"
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation error: {str(e)}")


@app.get("/api/models/info")
async def get_models_info():
    """Get information about loaded models"""
    return {
        "wildfire_prediction": {
            "model": "EfficientNetB3",
            "status": "loaded" if wildfire_model else "not_loaded",
            "input_size": f"{WILDFIRE_IMG_SIZE}x{WILDFIRE_IMG_SIZE}",
            "classes": 2,
            "metrics": {
                "accuracy": 0.9351,
                "precision": 0.942,
                "recall": 0.928,
                "auc": 0.9853,
                "f1_score": 0.935
            },
            "training": {
                "dataset_size": 42850,
                "training_samples": 30000,
                "validation_samples": 6400,
                "test_samples": 6450,
                "epochs": 50,
                "optimizer": "Adam",
                "learning_rate": "0.001 → 0.0001"
            }
        },
        "segmentation": {
            "model": "U-Net with ResNet50",
            "status": "loaded" if segmentation_model else "not_loaded",
            "input_size": f"{SEGMENTATION_IMG_SIZE}x{SEGMENTATION_IMG_SIZE}",
            "classes": 6,
            "class_info": SEGMENTATION_CLASSES
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
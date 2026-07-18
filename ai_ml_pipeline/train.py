# ai_ml_pipeline/train.py

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

def execute_model_training_pipeline():
    print("🚀 Initiating Machine Learning Model Training Pipeline...")

    # 1. Generate Synthetic Training Data (Hours Spent, Focus Score, Target Subject Code Index)
    np.random.seed(42)
    sample_size = 500
    
    X_data = {
        "logged_duration": np.random.randint(15, 180, sample_size),
        "day_of_week_encoded": np.random.randint(1, 8, sample_size),
        "target_subject_id": np.random.randint(101, 105, sample_size)
    }
    df = pd.DataFrame(X_data)
    
    # Target label: 0=Morning, 1=Afternoon, 2=Evening, 3=Night
    def assign_preferred_slot(row):
        if row["target_subject_id"] == 101:
            return 0  # Math tends to get handled early
        return int((row["logged_duration"] + row["day_of_week_encoded"]) % 4)

    y_labels = df.apply(assign_preferred_slot, axis=1)

    # 2. Train/Test Splits
    X_train, X_test, y_train, y_test = train_test_split(df, y_labels, test_test_split=0.2, random_state=42)

    # 3. Instantiate and Fit Model
    print("⚙️ Optimizing Random Forest hyperparameter constraints...")
    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    # Validate Performance Accuracy metrics
    accuracy = model.score(X_test, y_test)
    print(f"✅ Training complete. Test Split Evaluation Accuracy: {round(accuracy * 100, 2)}%")

    # 4. Serialize and Save Model Outputs
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)
    
    model_save_path = os.path.join(model_dir, "time_slot_predictor.pkl")
    with open(model_save_path, "wb") as file_buffer:
        pickle.dump(model, file_buffer)
        
    print(f"📦 Model output binary file successfully saved to: {model_save_path}")

if __name__ == "__main__":
    execute_model_training_pipeline()
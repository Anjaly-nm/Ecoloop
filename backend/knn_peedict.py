import sys, json
import pandas as pd
from sklearn.neighbors import KNeighborsRegressor
import numpy as np

# Read JSON input
input_data = json.loads(sys.stdin.read())

if not input_data:
    print(json.dumps({"error": "No data received"}))
    sys.exit()

# Convert to DataFrame
df = pd.DataFrame(input_data)
df["_id"] = df["_id"].apply(lambda x: {
    "ward": x.get("ward"),
    "category": x.get("category"),
    "month": x.get("month")
})

# Extract fields
df["ward"] = df["_id"].apply(lambda x: x["ward"])
df["category"] = df["_id"].apply(lambda x: x["category"])
df["month"] = df["_id"].apply(lambda x: x["month"])
df = df[["ward", "category", "month", "count"]].sort_values(by=["ward", "category", "month"])

predictions = []

# Predict per ward + category
for (ward, category), group in df.groupby(["ward", "category"]):
    X = group[["month"]]
    y = group["count"]

    if len(X) < 3:
        continue  # skip if not enough data points

    model = KNeighborsRegressor(n_neighbors=2)
    model.fit(X, y)

    next_month = group["month"].max() + 1
    if next_month > 12:
        next_month = 1  # wrap around December -> January

    predicted_count = model.predict([[next_month]])[0]

    predictions.append({
        "ward": ward,
        "category": category,
        "predicted_next_month": next_month,
        "predicted_count": round(float(predicted_count), 2)
    })

print(json.dumps(predictions))

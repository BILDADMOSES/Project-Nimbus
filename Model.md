# Swahili-English Translation Model Fine-Tuning and Deployment

## Overview
This repository documents the process of fine-tuning and training a Swahili-English translation model. The model was fine-tuned and trained four times on a Google Cloud Platform (GCP) notebook instance, utilizing a Virtual Machine (VM) with 8 vCPUs and 32 GB of RAM. After completing the training, the model was successfully deployed on Hugging Face for public use.

<img src = "Screenshot 2024-08-28 170619.png">

## Training Environment
- **Platform:** Google Cloud Platform (GCP)
- **Instance Type:** Compute Engine VM
- **vCPUs:** 8
- **RAM:** 32 GB
- **Notebook Instance:** GCP AI Platform Notebooks

## Training Process

### Dataset Preparation
- Collected and preprocessed a dataset of Swahili-English text pairs for training.
- Used standard text preprocessing techniques such as tokenization, padding, and cleaning of the dataset to ensure high-quality input.

<img src ="Screenshot 2024-08-28 172113.png">

<img src ="Screenshot 2024-08-28 172151.png">

### Model Selection
- Chose a pre-trained transformer-based model suitable for translation tasks.
- The base model was selected for its effectiveness in low-resource language pairs.

<img src ="Screenshot 2024-08-28 171825.png">

### Fine-Tuning
- Fine-tuned the model on the Swahili-English dataset in four iterations.
- Adjusted hyperparameters such as learning rate, batch size, and epochs to optimize performance.
- Utilized the GCP VM with 8 vCPUs and 32 GB RAM for efficient processing during training.


### Deployment
- Once the final iteration was completed, the model was exported and prepared for deployment.
- The model was then uploaded and deployed on Hugging Face's model hub.

## Deployment Link
The fine-tuned Swahili-English translation model is publicly available on Hugging Face and can be accessed through the following link:

<img src = "Screenshot 2024-08-28 171557.png">

[Swahili-English Translation Model on Hugging Face](https://huggingface.co/Bildad/Swahili-English_Translation)

## Usage
To use the model, you can either download it from Hugging Face or use the Inference API provided on the Hugging Face model page. Below is a sample Python code snippet for using the model via the Hugging Face Transformers library:

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Load the model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("Bildad/Swahili-English_Translation")
model = AutoModelForSeq2SeqLM.from_pretrained("Bildad/Swahili-English_Translation")

# Sample translation
input_text = "Habari, unafanyaje?"
inputs = tokenizer(input_text, return_tensors="pt")
outputs = model.generate(**inputs)
translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(f"Translated text: {translated_text}")

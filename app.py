from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

ANIMALS = [
    {"id": "anjing", "name": "Anjing", "name_en": "Dog"},
    {"id": "babi", "name": "Babi", "name_en": "Pig"},
    {"id": "gajah", "name": "Gajah", "name_en": "Elephant"},
    {"id": "kambing", "name": "Kambing", "name_en": "Goat"},
    {"id": "kucing", "name": "Kucing", "name_en": "Cat"},
    {"id": "kuda", "name": "Kuda", "name_en": "Horse"},
    {"id": "monyet", "name": "Monyet", "name_en": "Monkey"},
    {"id": "sapi", "name": "Sapi", "name_en": "Cow"},
    {"id": "serigala", "name": "Serigala", "name_en": "Wolf"},
    {"id": "singa", "name": "Singa", "name_en": "Lion"},
]

TOTAL_QUESTIONS = 10

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/quiz")
def generate_quiz():
    animals = ANIMALS.copy()
    random.shuffle(animals)
    questions = []
    for i, correct_animal in enumerate(animals[:TOTAL_QUESTIONS]):
        wrong_pool = [a for a in ANIMALS if a["id"] != correct_animal["id"]]
        wrong_choices = random.sample(wrong_pool, 3)
        choices = wrong_choices + [correct_animal]
        random.shuffle(choices)
        questions.append({
            "question_number": i + 1,
            "correct_animal": correct_animal,
            "choices": choices,
        })
    return jsonify({"questions": questions, "total": TOTAL_QUESTIONS})

if __name__ == "__main__":
    app.run(debug=True, port=5000)

from flask import Flask, render_template, request, redirect, session
from typing import List, Annotated
from random import choice, choices

app = Flask(__name__)
app.secret_key = "Asldkfu82348AHSDLf82834laSDFLu#oayf"

def generate_pattern(active_subdivisions: list[int], number_bars: int) -> list[int]:
        """
            Generates a new array with random numbers between 1 and 4.\n
            It modifies the instance pattern attribute with the new array and clears the previous one.\n
            The size of the pattern will be defined by the pattern_num_bars.
        """
        
        new_pattern = []
        for _ in range(4 * number_bars):
            new_pattern.append(choice(active_subdivisions))
        
        return new_pattern


@app.route("/")
def home():
    session["num_bars"] = 4
    if not "active_subdivisions" in session:
        session["active_subdivisions"] = [1, 2, 3, 4]
    session["pattern"] = generate_pattern(active_subdivisions=session["active_subdivisions"], number_bars=session["num_bars"])
    return render_template("index.html", pattern=session["pattern"])

@app.route("/generate-pattern", methods=["GET", "POST"])
def generate_new_pattern():
    session["pattern"] = generate_pattern(active_subdivisions=session["active_subdivisions"], number_bars=session["num_bars"])
    return render_template("beat_pattern.html", pattern=session["pattern"])

@app.route("/app-set-up")
def app_set_up():
    return render_template("app-setup.html", title="Set-up")

@app.route("/confirm-selection", methods=["GET", "POST"])
def confirm_selection():
    if request.method == "POST":
        session["active_subdivisions"] = request.form.getlist("selected_ids")
    return redirect("/", code=303)
    
if __name__ == "__main__":
    app.run(debug=True)
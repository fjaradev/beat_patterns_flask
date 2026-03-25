from flask import Flask, render_template, request, redirect
from typing import List, Annotated
from random import choice, choices

app = Flask(__name__)

class Sequencer:
    
    """
        Class that makes an object with the pattern that will be generated.
    """
    
    def __init__(self):
        self.pattern: List[int] = []
        self.pattern_num_bars: int = 4
        self.active_subdivisions: List[int] = [1, 2, 3, 4]
        
    def generate_pattern(self):
        """
            Generates a new array with random numbers between 1 and 4.\n
            It modifies the instance pattern attribute with the new array and clears the previous one.\n
            The size of the pattern will be defined by the pattern_num_bars.
        """
        
        self.pattern.clear()
        for _ in range(4 * self.pattern_num_bars):
            self.pattern.append(choice(self.active_subdivisions))
            

sequencer = Sequencer()


@app.route("/")
def home():
    sequencer.generate_pattern()
    return render_template("index.html", pattern=sequencer.pattern)

@app.route("/generate-pattern")
def generate_pattern():
    sequencer.generate_pattern()
    return render_template("beat_pattern.html", pattern=sequencer.pattern)

@app.route("/app-set-up")
def app_set_up():
    return render_template("app-setup.html", title="Set-up")

@app.route("/confirm-selection", methods=["GET", "POST"])
def confirm_selection():
    if request.method == "POST":
        sequencer.active_subdivisions = request.form.getlist("selected_ids")
    return redirect("/", code=303)
    
if __name__ == "__main__":
    app.run(debug=True)
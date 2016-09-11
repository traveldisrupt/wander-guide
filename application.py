from flask import Flask, render_template


app = Flask(__name__)


@app.route('/')
def landing():
    return 'Hello, World!'


@app.route('/guide/')
def guide_dashboard():
    return render_template("main.html")


if __name__ == "__main__":
    app.debug = True
    app.run()

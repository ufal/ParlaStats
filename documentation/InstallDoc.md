# ParlaStats - Installation Guide
- To be able to run the application, you will need some external Python libraries.
- All of them are listed <a href="https://github.com/ufal/ParlaStats/blob/main/requirements.txt">here</a>.
- You can make a Python virtual environment:
    ```shell
    [ParlaStats] $ python3 -m venv ParlaStatsVenv
    [ParlaStats] $ source ParlaStatsVenv/bin/activate
    (ParlaStatsVenv) [ParlaStats] $ pip install -r requirements.txt
    ```
- Or you may skip the virtual environment step if you wish.
- After successfully installing the dependencies, you can now proceed according to <a href="https://github.com/ufal/ParlaStats/blob/main/documentation/UserDoc.md">User documentation<a>.
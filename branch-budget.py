from __future__ import print_function

import os.path
import subprocess
import itertools
import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file google-sheets-token.json.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

# The ID and range of the spreadsheet to target.
SPREADSHEET_ID = '1c8LfQl5Xx-DdKT8tb1wZ4TgGmGfO-013IGnXSySSfKQ'
RANGE_NAME = 'Branch Log!A1'


def main():

    # branches = os.listdir('.git/refs/heads')
    # branches = subprocess.check_output(
    #     ["git", "branch", "-r"]).decode().split('\n')
    # branches = list(branch.strip() for branch in branches)
    # branches = list(
    #     branch for branch in branches if branch != "" and not branch.startswith("origin/HEAD")
    # )
    remote_branches = subprocess.check_output([
        "git", "--no-pager", "log", "--simplify-by-decoration", "--remotes", "--pretty=format:%H (%cI)%d %s"
    ]).decode().replace('HEAD -> ', '').split('\n')
    print("remote branches:\n\n" + "\n".join(remote_branches))
    local_branches = subprocess.check_output([
        "git", "--no-pager", "log", "--simplify-by-decoration", "--branches", "--pretty=format:%H (%cI)%d %s"
    ]).decode().replace('HEAD -> ', '').split('\n')
    print("local branches:\n\n" + "\n".join(local_branches))
    stashes = subprocess.check_output([
        "git", "--no-pager", "stash", "list", "--pretty=format:%H (%cI) %gs"
    ]).decode().split('\n')
    print("stashes:\n\n" + "\n".join(stashes))
    # return

    creds = None
    # The file google-sheets-token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('google-sheets-token.json'):
        creds = Credentials.from_authorized_user_file(
            'google-sheets-token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'google-sheets-credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('google-sheets-token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('sheets', 'v4', credentials=creds)

        # Call the Sheets API
        sheet = service.spreadsheets()
        values = []
        date = datetime.datetime.now().isoformat()

        for (remote_branch, local_branch, stash) in itertools.zip_longest(remote_branches, local_branches, stashes):
            values.append([date, remote_branch, local_branch, stash])
        body = {
            'values': values
        }
        result = service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME,
            valueInputOption="USER_ENTERED", body=body).execute()
        print(f"{(result.get('updates').get('updatedCells'))} cells appended.")

    except HttpError as err:
        print(err)


if __name__ == '__main__':
    main()

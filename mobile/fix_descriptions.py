import re

with open('src/screens/OverviewDashboard.tsx', 'r') as f:
    content = f.read()

# Remove all description lines - match the comma and content before the newline
content = re.sub(r',\s*description:\s*[^,\n]+', '', content)

with open('src/screens/OverviewDashboard.tsx', 'w') as f:
    f.write(content)

print('Removed all description fields')

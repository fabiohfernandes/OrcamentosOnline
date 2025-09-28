#!/bin/bash

echo "QUICK TEST - Current Status"
BASE_FRONTEND="http://localhost:3001"

# Test all pages once
pages=("/" "/auth/login" "/auth/register" "/dashboard" "/clients" "/proposals" "/proposals/create" "/settings" "/reports")

for page in "${pages[@]}"; do
    http_code=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_FRONTEND$page")
    if [ "$http_code" = "200" ]; then
        echo "✅ $page: HTTP 200"
    else
        echo "❌ $page: HTTP $http_code"
    fi
done
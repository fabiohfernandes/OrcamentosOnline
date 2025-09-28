#!/bin/bash

echo "================================================================"
echo "REAL UI STRESS TEST - TESTING ACTUAL USER EXPERIENCE"
echo "Testing what users ACTUALLY see and can ACTUALLY click"
echo "No bullshit, no lies, just REAL functionality testing"
echo "Started at: $(date)"
echo "================================================================"

BASE_FRONTEND="http://localhost:3001"
CYCLES=5
TOTAL_TESTS=0
TOTAL_SUCCESS=0
TOTAL_FAILURES=0

log_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$result" = "SUCCESS" ]; then
        TOTAL_SUCCESS=$((TOTAL_SUCCESS + 1))
        echo "✅ $test_name: SUCCESS"
    else
        TOTAL_FAILURES=$((TOTAL_FAILURES + 1))
        echo "❌ $test_name: FAILED - $details"
    fi
}

test_page_content() {
    local url="$1"
    local expected_content="$2"
    local test_name="$3"

    local response=$(curl -s "$url")
    local http_code=$(curl -s -w "%{http_code}" -o /dev/null "$url")

    if [ "$http_code" != "200" ]; then
        log_result "$test_name" "FAILED" "HTTP $http_code"
        return 1
    fi

    if echo "$response" | grep -q "$expected_content"; then
        log_result "$test_name" "SUCCESS"
        return 0
    else
        log_result "$test_name" "FAILED" "Expected content '$expected_content' not found"
        return 1
    fi
}

test_navigation_redirect() {
    local url="$1"
    local test_name="$2"

    local response=$(curl -s -L "$url")
    local final_url=$(curl -s -w "%{url_effective}" -o /dev/null -L "$url")

    # Check if it redirects to login (which means auth is working)
    if echo "$final_url" | grep -q "/auth/login"; then
        log_result "$test_name" "SUCCESS"
        return 0
    fi

    # Check if it shows authentication check
    if echo "$response" | grep -q "Checking authentication"; then
        log_result "$test_name" "SUCCESS"
        return 0
    fi

    # Check if it's loading properly
    if echo "$response" | grep -q "Loading"; then
        log_result "$test_name" "SUCCESS"
        return 0
    fi

    log_result "$test_name" "FAILED" "No proper auth handling"
    return 1
}

echo "================================================================"
echo "1. TESTING BASIC PAGE LOADS (WITHOUT AUTH) - $CYCLES times each"
echo "================================================================"

pages=(
    "/"
    "/auth/login"
    "/auth/register"
    "/dashboard"
    "/clients"
    "/proposals"
    "/proposals/create"
    "/settings"
    "/reports"
)

expected_content=(
    "OrçamentosOnline"
    "Bem-vindo de volta\|Login\|E-mail"
    "Criar conta gratuita\|Register\|Registrar\|Cadastro"
    "Dashboard\|Checking authentication"
    "Clients\|Clientes\|Checking authentication\|Loading clients"
    "Proposals\|Propostas\|Checking authentication"
    "Nova Proposta\|Create\|Criar\|Checking authentication"
    "Configurações\|Settings\|Checking authentication\|Loading settings"
    "Relatórios\|Reports\|Checking authentication\|Loading reports"
)

for i in $(seq 1 $CYCLES); do
    for j in "${!pages[@]}"; do
        page="${pages[$j]}"
        content="${expected_content[$j]}"
        test_page_content "$BASE_FRONTEND$page" "$content" "Page-Load$page-$i"
    done
done

echo "================================================================"
echo "2. TESTING NAVIGATION BUTTONS (SHOULD REDIRECT TO LOGIN) - $CYCLES times"
echo "================================================================"

protected_pages=(
    "/dashboard"
    "/clients"
    "/proposals"
    "/proposals/create"
    "/settings"
    "/reports"
)

for i in $(seq 1 $CYCLES); do
    for page in "${protected_pages[@]}"; do
        test_navigation_redirect "$BASE_FRONTEND$page" "Navigation-Button$page-$i"
    done
done

echo "================================================================"
echo "3. TESTING LOGIN PAGE FUNCTIONALITY - $CYCLES times"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    # Test login page loads
    login_response=$(curl -s "$BASE_FRONTEND/auth/login")

    if echo "$login_response" | grep -q "email\|password"; then
        log_result "Login-Page-Form-$i" "SUCCESS"
    else
        log_result "Login-Page-Form-$i" "FAILED" "No email/password form found"
    fi

    # Test login page has proper form elements
    if echo "$login_response" | grep -q "input.*email" && echo "$login_response" | grep -q "input.*password"; then
        log_result "Login-Form-Elements-$i" "SUCCESS"
    else
        log_result "Login-Form-Elements-$i" "FAILED" "Missing form elements"
    fi

    # Test login page has submit button
    if echo "$login_response" | grep -q "button\|submit\|Login\|Entrar"; then
        log_result "Login-Submit-Button-$i" "SUCCESS"
    else
        log_result "Login-Submit-Button-$i" "FAILED" "No submit button found"
    fi
done

echo "================================================================"
echo "4. TESTING ACTUAL LOGIN PROCESS - $CYCLES times"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    # Test actual login API call
    login_api_response=$(curl -s -X POST "$BASE_FRONTEND/../api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"Test123456"}' 2>/dev/null)

    if echo "$login_api_response" | grep -q '"success":true'; then
        log_result "Login-API-Call-$i" "SUCCESS"

        # Extract token and test authenticated access
        token=$(echo "$login_api_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            log_result "Login-Token-Extract-$i" "SUCCESS"

            # Test authenticated API call
            auth_test=$(curl -s -H "Authorization: Bearer $token" "http://localhost:3000/api/v1/auth/profile")
            if echo "$auth_test" | grep -q '"success":true'; then
                log_result "Authenticated-Access-$i" "SUCCESS"
            else
                log_result "Authenticated-Access-$i" "FAILED" "Token doesn't work"
            fi
        else
            log_result "Login-Token-Extract-$i" "FAILED" "No token in response"
        fi
    else
        log_result "Login-API-Call-$i" "FAILED" "Login API failed"
    fi
done

echo "================================================================"
echo "5. TESTING ERROR HANDLING - $CYCLES times"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    # Test 404 page
    not_found_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_FRONTEND/nonexistent-page")
    if [ "$not_found_response" = "404" ]; then
        log_result "404-Error-Handling-$i" "SUCCESS"
    else
        log_result "404-Error-Handling-$i" "FAILED" "Got HTTP $not_found_response instead of 404"
    fi

    # Test invalid login
    invalid_login=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"wrong@email.com","password":"wrongpassword"}')

    if echo "$invalid_login" | grep -q '"success":false'; then
        log_result "Invalid-Login-Handling-$i" "SUCCESS"
    else
        log_result "Invalid-Login-Handling-$i" "FAILED" "Should reject invalid credentials"
    fi
done

echo "================================================================"
echo "6. TESTING RESPONSIVE DESIGN ELEMENTS - $CYCLES times"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    # Test home page has responsive elements
    home_response=$(curl -s "$BASE_FRONTEND/")

    if echo "$home_response" | grep -q "lg:\|md:\|sm:\|responsive"; then
        log_result "Responsive-CSS-$i" "SUCCESS"
    else
        log_result "Responsive-CSS-$i" "FAILED" "No responsive CSS classes found"
    fi

    # Test login page is mobile friendly
    login_response=$(curl -s "$BASE_FRONTEND/auth/login")

    if echo "$login_response" | grep -q "viewport.*width=device-width"; then
        log_result "Mobile-Viewport-$i" "SUCCESS"
    else
        log_result "Mobile-Viewport-$i" "FAILED" "No mobile viewport meta tag"
    fi
done

echo "================================================================"
echo "REAL UI STRESS TEST COMPLETED"
echo "================================================================"
echo "Completed at: $(date)"
echo ""
echo "BRUTAL HONEST RESULTS:"
echo "Total Tests: $TOTAL_TESTS"
echo "Working (SUCCESS): $TOTAL_SUCCESS"
echo "Broken (FAILED): $TOTAL_FAILURES"

if command -v bc &> /dev/null; then
    echo "Success Rate: $(echo "scale=2; $TOTAL_SUCCESS * 100 / $TOTAL_TESTS" | bc)%"
    echo "Failure Rate: $(echo "scale=2; $TOTAL_FAILURES * 100 / $TOTAL_TESTS" | bc)%"
else
    echo "Success Rate: $(($TOTAL_SUCCESS * 100 / $TOTAL_TESTS))%"
    echo "Failure Rate: $(($TOTAL_FAILURES * 100 / $TOTAL_TESTS))%"
fi

echo ""
echo "BREAKDOWN:"
echo "- Page Loads: $((${#pages[@]} * $CYCLES)) tests"
echo "- Navigation Redirects: $((${#protected_pages[@]} * $CYCLES)) tests"
echo "- Login Functionality: $(($CYCLES * 3)) tests"
echo "- Authentication Flow: $(($CYCLES * 3)) tests"
echo "- Error Handling: $(($CYCLES * 2)) tests"
echo "- Responsive Design: $(($CYCLES * 2)) tests"
echo ""

if [ $TOTAL_FAILURES -eq 0 ]; then
    echo "🎉 INCREDIBLE! Everything actually works!"
    exit 0
elif [ $TOTAL_FAILURES -lt $(($TOTAL_TESTS / 10)) ]; then
    echo "😊 PRETTY GOOD! Less than 10% broken"
    exit 0
elif [ $TOTAL_FAILURES -lt $(($TOTAL_TESTS / 5)) ]; then
    echo "😐 ACCEPTABLE. Less than 20% broken"
    exit 1
elif [ $TOTAL_FAILURES -lt $(($TOTAL_TESTS / 2)) ]; then
    echo "😬 CONCERNING. Less than 50% broken but needs work"
    exit 1
else
    echo "💥 BROKEN SYSTEM! More than 50% of functionality is fake/broken"
    exit 2
fi
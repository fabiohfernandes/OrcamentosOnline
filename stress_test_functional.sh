#!/bin/bash

echo "================================================================"
echo "FUNCTIONAL STRESS TEST - TESTING REAL USER ACTIONS"
echo "Testing if users can ACTUALLY DO THINGS, not just load pages"
echo "Testing REAL functionality like creating, editing, deleting"
echo "Started at: $(date)"
echo "================================================================"

BASE_API="http://localhost:3000/api/v1"
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

# Get auth token for testing
get_auth_token() {
    local login_resp=$(curl -s -X POST "$BASE_API/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"Test123456"}')

    if echo "$login_resp" | grep -q '"success":true'; then
        echo "$login_resp" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
    else
        echo ""
    fi
}

echo "================================================================"
echo "1. TESTING ACTUAL CLIENT CREATION - $CYCLES times"
echo "Testing if users can REALLY create and save clients"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    token=$(get_auth_token)

    if [ -z "$token" ]; then
        log_result "Client-Creation-$i" "FAILED" "Could not get auth token"
        continue
    fi

    # Create a real client with real data
    client_data='{
        "name":"Functional Test Client '$i'",
        "email":"functest'$i'@example.com",
        "phone":"(11) 9'$(printf "%04d" $i)'-'$(printf "%04d" $((i+1000)))'",
        "company":"Functional Test Company '$i'",
        "status":"active",
        "document":"000.000.000-'$(printf "%02d" $((i % 100)))'",
        "document_type":"cpf",
        "address":{
            "street":"Functional Test Street",
            "number":"'$i'",
            "city":"Test City",
            "state":"SP",
            "cep":"01234-567",
            "neighborhood":"Test Neighborhood"
        }
    }'

    # Attempt to create client
    create_resp=$(curl -s -X POST "$BASE_API/clients" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$client_data")

    if echo "$create_resp" | grep -q '"success":true'; then
        # Extract client ID
        client_id=$(echo "$create_resp" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

        if [ -n "$client_id" ]; then
            # Verify client was actually saved by retrieving it
            get_resp=$(curl -s -H "Authorization: Bearer $token" "$BASE_API/clients/$client_id")

            if echo "$get_resp" | grep -q "Functional Test Client $i"; then
                log_result "Client-Creation-$i" "SUCCESS"

                # Test if we can actually update the client
                update_resp=$(curl -s -X PUT "$BASE_API/clients/$client_id" \
                    -H "Authorization: Bearer $token" \
                    -H "Content-Type: application/json" \
                    -d '{"name":"Updated Functional Client '$i'"}')

                if echo "$update_resp" | grep -q '"success":true'; then
                    log_result "Client-Update-$i" "SUCCESS"
                else
                    log_result "Client-Update-$i" "FAILED" "Update API failed"
                fi

                # Test if we can actually delete the client
                delete_resp=$(curl -s -X DELETE "$BASE_API/clients/$client_id" \
                    -H "Authorization: Bearer $token")

                if echo "$delete_resp" | grep -q '"success":true'; then
                    log_result "Client-Delete-$i" "SUCCESS"
                else
                    log_result "Client-Delete-$i" "FAILED" "Delete API failed"
                fi
            else
                log_result "Client-Creation-$i" "FAILED" "Client not found after creation"
            fi
        else
            log_result "Client-Creation-$i" "FAILED" "No client ID returned"
        fi
    else
        log_result "Client-Creation-$i" "FAILED" "API returned error: $create_resp"
    fi
done

echo "================================================================"
echo "2. TESTING ACTUAL PROPOSAL CREATION - $CYCLES times"
echo "Testing if users can REALLY create and save proposals"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    token=$(get_auth_token)

    if [ -z "$token" ]; then
        log_result "Proposal-Creation-$i" "FAILED" "Could not get auth token"
        continue
    fi

    # Create a real proposal with real data (using correct API fields)
    proposal_data='{
        "proposalName":"Functional Test Proposal '$i'",
        "clientName":"Functional Test Client '$i'",
        "jobName":"Functional Test Job '$i'",
        "presentationUrl":"https://docs.google.com/presentation/d/test'$i'",
        "commercialProposalUrl":"https://docs.google.com/document/d/test'$i'",
        "scopeText":"This is the scope text for functional test proposal '$i'. It includes all the work that needs to be done.",
        "termsText":"These are the terms and conditions for proposal '$i'. Payment due within 30 days.",
        "clientUsername":"functest_client_'$(date +%s%N)'_'$i'",
        "clientPassword":"TestPass'$i'123",
        "proposalValue":1500.00
    }'

    # Attempt to create proposal
    create_resp=$(curl -s -X POST "$BASE_API/proposals" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$proposal_data")

    if echo "$create_resp" | grep -q '"success":true'; then
        # Extract proposal ID
        proposal_id=$(echo "$create_resp" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

        if [ -n "$proposal_id" ]; then
            # Verify proposal was actually saved
            get_resp=$(curl -s -H "Authorization: Bearer $token" "$BASE_API/proposals/$proposal_id")

            if echo "$get_resp" | grep -q "Functional Test Proposal $i"; then
                log_result "Proposal-Creation-$i" "SUCCESS"

                # Test if we can update the proposal
                update_resp=$(curl -s -X PUT "$BASE_API/proposals/$proposal_id" \
                    -H "Authorization: Bearer $token" \
                    -H "Content-Type: application/json" \
                    -d '{"proposalName":"Updated Functional Proposal '$i'"}')

                if echo "$update_resp" | grep -q '"success":true'; then
                    log_result "Proposal-Update-$i" "SUCCESS"
                else
                    log_result "Proposal-Update-$i" "FAILED" "Update API failed"
                fi
            else
                log_result "Proposal-Creation-$i" "FAILED" "Proposal not found after creation"
            fi
        else
            log_result "Proposal-Creation-$i" "FAILED" "No proposal ID returned"
        fi
    else
        log_result "Proposal-Creation-$i" "FAILED" "API returned error: $create_resp"
    fi
done

echo "================================================================"
echo "3. TESTING DATABASE PERSISTENCE - $CYCLES times"
echo "Testing if data actually STAYS in the database"
echo "================================================================"

# Create some test data first
created_clients=()
token=$(get_auth_token)

for i in $(seq 1 $CYCLES); do
    if [ -n "$token" ]; then
        create_resp=$(curl -s -X POST "$BASE_API/clients" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d '{
                "name":"Persistence Test '$i'",
                "email":"persist'$i'@test.com",
                "phone":"(11) 8888-'$(printf "%04d" $i)'",
                "company":"Persistence Company",
                "status":"active"
            }')

        client_id=$(echo "$create_resp" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$client_id" ]; then
            created_clients+=("$client_id")
        fi
    fi
done

# Wait a moment to simulate real usage
sleep 2

# Now verify all created clients still exist
for i in "${!created_clients[@]}"; do
    client_id="${created_clients[$i]}"
    get_resp=$(curl -s -H "Authorization: Bearer $token" "$BASE_API/clients/$client_id")

    if echo "$get_resp" | grep -q "Persistence Test"; then
        log_result "Database-Persistence-$((i+1))" "SUCCESS"
    else
        log_result "Database-Persistence-$((i+1))" "FAILED" "Data lost from database"
    fi
done

echo "================================================================"
echo "4. TESTING FORM VALIDATION - $CYCLES times"
echo "Testing if forms actually VALIDATE user input"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    token=$(get_auth_token)

    if [ -z "$token" ]; then
        log_result "Form-Validation-$i" "FAILED" "Could not get auth token"
        continue
    fi

    # Test invalid email validation
    invalid_client='{
        "name":"",
        "email":"invalid-email",
        "phone":"invalid-phone",
        "company":"Test Company",
        "status":"invalid-status"
    }'

    invalid_resp=$(curl -s -X POST "$BASE_API/clients" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$invalid_client")

    # Should fail with validation errors
    if echo "$invalid_resp" | grep -q '"success":false'; then
        log_result "Form-Validation-$i" "SUCCESS"
    else
        log_result "Form-Validation-$i" "FAILED" "Validation should have failed but didn't"
    fi
done

echo "================================================================"
echo "5. TESTING REAL USER WORKFLOWS - $CYCLES times"
echo "Testing complete user journeys from start to finish"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    token=$(get_auth_token)

    if [ -z "$token" ]; then
        log_result "User-Workflow-$i" "FAILED" "Could not get auth token"
        continue
    fi

    # WORKFLOW: Create client -> Create proposal for client -> Update proposal -> Get final result

    # Step 1: Create client (simplified data)
    client_resp=$(curl -s -X POST "$BASE_API/clients" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{
            "name":"Workflow Client '$i'",
            "email":"workflow'$i'@test.com",
            "phone":"(11) 7777-'$(printf "%04d" $i)'",
            "company":"Workflow Company '$i'",
            "status":"active"
        }')

    client_id=$(echo "$client_resp" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$client_id" ]; then
        log_result "User-Workflow-$i" "FAILED" "Step 1: Client creation failed"
        continue
    fi

    # Step 2: Create proposal for that client
    proposal_resp=$(curl -s -X POST "$BASE_API/proposals" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{
            "proposalName":"Workflow Proposal for Client '$i'",
            "clientName":"Workflow Client '$i'",
            "jobName":"Complete workflow test",
            "scopeText":"Complete workflow test scope",
            "termsText":"Complete workflow test terms",
            "clientUsername":"workflow_client_'$(date +%s%N)'_'$i'",
            "clientPassword":"WorkflowPass'$i'123",
            "proposalValue":2000.00
        }')

    proposal_id=$(echo "$proposal_resp" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$proposal_id" ]; then
        log_result "User-Workflow-$i" "FAILED" "Step 2: Proposal creation failed"
        continue
    fi

    # Step 3: Update proposal status (just update the name for now)
    update_resp=$(curl -s -X PUT "$BASE_API/proposals/$proposal_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"proposalName":"Updated Workflow Proposal '$i'"}')

    if ! echo "$update_resp" | grep -q '"success":true'; then
        log_result "User-Workflow-$i" "FAILED" "Step 3: Proposal update failed"
        continue
    fi

    # Step 4: Verify complete workflow by getting updated data
    final_proposal=$(curl -s -H "Authorization: Bearer $token" "$BASE_API/proposals/$proposal_id")
    final_client=$(curl -s -H "Authorization: Bearer $token" "$BASE_API/clients/$client_id")

    if echo "$final_proposal" | grep -q "Updated Workflow Proposal $i" && echo "$final_client" | grep -q "Workflow Client $i"; then
        log_result "User-Workflow-$i" "SUCCESS"
    else
        log_result "User-Workflow-$i" "FAILED" "Step 4: Final verification failed"
    fi
done

echo "================================================================"
echo "6. TESTING AUTHENTICATION SECURITY - $CYCLES times"
echo "Testing if authentication actually PROTECTS resources"
echo "================================================================"

for i in $(seq 1 $CYCLES); do
    # Test 1: Try to access protected resource without token
    unauth_resp=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_API/clients")

    if [ "$unauth_resp" = "401" ]; then
        log_result "Auth-Protection-$i" "SUCCESS"
    else
        log_result "Auth-Protection-$i" "FAILED" "Unprotected resource (got HTTP $unauth_resp)"
    fi

    # Test 2: Try to access with invalid token
    invalid_resp=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: Bearer FAKE_TOKEN_123" "$BASE_API/clients")

    if [ "$invalid_resp" = "403" ] || [ "$invalid_resp" = "401" ]; then
        log_result "Auth-Invalid-Token-$i" "SUCCESS"
    else
        log_result "Auth-Invalid-Token-$i" "FAILED" "Invalid token accepted (got HTTP $invalid_resp)"
    fi
done

echo "================================================================"
echo "FUNCTIONAL STRESS TEST COMPLETED"
echo "================================================================"
echo "Completed at: $(date)"
echo ""
echo "BRUTAL HONEST FUNCTIONAL RESULTS:"
echo "Total Tests: $TOTAL_TESTS"
echo "Actually Working: $TOTAL_SUCCESS"
echo "Actually Broken: $TOTAL_FAILURES"

if command -v bc &> /dev/null; then
    echo "Real Success Rate: $(echo "scale=2; $TOTAL_SUCCESS * 100 / $TOTAL_TESTS" | bc)%"
    echo "Real Failure Rate: $(echo "scale=2; $TOTAL_FAILURES * 100 / $TOTAL_TESTS" | bc)%"
else
    echo "Real Success Rate: $(($TOTAL_SUCCESS * 100 / $TOTAL_TESTS))%"
    echo "Real Failure Rate: $(($TOTAL_FAILURES * 100 / $TOTAL_TESTS))%"
fi

echo ""
echo "FUNCTIONAL BREAKDOWN:"
echo "- Client Creation & CRUD: $(($CYCLES * 3)) tests"
echo "- Proposal Creation & Updates: $(($CYCLES * 2)) tests"
echo "- Database Persistence: $CYCLES tests"
echo "- Form Validation: $CYCLES tests"
echo "- Complete User Workflows: $CYCLES tests"
echo "- Authentication Security: $(($CYCLES * 2)) tests"
echo ""

if [ $TOTAL_FAILURES -eq 0 ]; then
    echo "🎉 AMAZING! All functionality ACTUALLY works!"
    exit 0
elif [ $TOTAL_FAILURES -lt $(($TOTAL_TESTS / 20)) ]; then
    echo "😊 EXCELLENT! Less than 5% of functionality is broken"
    exit 0
elif [ $TOTAL_FAILURES -lt $(($TOTAL_TESTS / 10)) ]; then
    echo "😐 GOOD. Less than 10% of functionality is broken"
    exit 1
elif [ $TOTAL_FAILURES -lt $(($TOTAL_TESTS / 2)) ]; then
    echo "😬 CONCERNING. Less than 50% of functionality works"
    exit 1
else
    echo "💥 SYSTEM IS FAKE! Most functionality doesn't actually work"
    exit 2
fi
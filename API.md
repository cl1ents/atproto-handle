---
title: API Documentation v1.0.0
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="api-documentation">API Documentation v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

API documentation for atproto-handle

Base URLs:

* <a href="http://localhost:3000/">http://localhost:3000/</a>

# Authentication

* API Key (ApiKeyAuth)
    - Parameter Name: **api-key**, in: header. 

<h1 id="api-documentation-default">Default</h1>

## claimDomain

<a id="opIdclaimDomain"></a>

`POST /claim`

*Add a did for the requested domain*

Adds a did for the requested domain

> Body parameter

```
did:plc:1234567890 or yourhandle.bsky.app

```

<h3 id="claimdomain-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|string|true|none|

> Example responses

> 200 Response

```
"string"
```

<h3 id="claimdomain-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Added the did|string|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|The domain or handle is missing|string|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Failed to add the did|string|

<aside class="success">
This operation does not require authentication
</aside>

## shredder

<a id="opIdshredder"></a>

`GET /factory`

*Shredder*

Serves the shredder page

> Example responses

<h3 id="shredder-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The shredder page|None|

<h3 id="shredder-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## shredderPost

<a id="opIdshredderPost"></a>

`POST /shredder`

*Shredder post*

Handles the shredder form

> Body parameter

```yaml
handle: string

```

<h3 id="shredderpost-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» handle|body|string|false|The handle to claim|

> Example responses

<h3 id="shredderpost-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Should redirect to the oauth client|None|

<h3 id="shredderpost-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## shredderCallback

<a id="opIdshredderCallback"></a>

`GET /shredder/callback`

*Shredder callback*

Handles the callback from the oauth client

> Example responses

<h3 id="shreddercallback-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Should redirect to the shredder page|None|

<h3 id="shreddercallback-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## clientMetadata

<a id="opIdclientMetadata"></a>

`GET /client-metadata.json`

*Client metadata*

Returns the client metadata for the oauth client

> Example responses

<h3 id="clientmetadata-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The client metadata|None|

<h3 id="clientmetadata-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="api-documentation-well-known">Well-Known</h1>

## getWellKnownAtprotoDid

<a id="opIdgetWellKnownAtprotoDid"></a>

`GET /well-known/atproto-did`

*Get the did for a given domain*

Returns the did for a given domain

> Example responses

> 200 Response

```
"string"
```

<h3 id="getwellknownatprotodid-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The did for the given domain|string|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|The domain is not found|string|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="api-documentation-public">Public</h1>

## redirectToBskyProfile

<a id="opIdredirectToBskyProfile"></a>

`GET /`

*Redirect to the bsky profile for a given domain*

Redirects to the bsky profile for a given domain

> Example responses

> 302 Response

```
"string"
```

<h3 id="redirecttobskyprofile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|302|[Found](https://tools.ietf.org/html/rfc7231#section-6.4.3)|Redirects to the bsky profile for the given domain|string|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|The domain is not found|string|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="api-documentation-protected">Protected</h1>

## removeDid

<a id="opIdremoveDid"></a>

`DELETE /`

*Remove the did for the requested domain*

Removes the did for the requested domain

> Example responses

> 200 Response

```
"string"
```

<h3 id="removedid-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Removed the did|string|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Failed to remove the did|string|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth
</aside>

## reloadDb

<a id="opIdreloadDb"></a>

`GET /reload`

*Reload the db*

Reloads the db

> Example responses

> 200 Response

```
"string"
```

<h3 id="reloaddb-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Reloaded the db|string|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Failed to reload the db|string|

<aside class="success">
This operation does not require authentication
</aside>


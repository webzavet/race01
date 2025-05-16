# Race01.TestApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**testPost**](TestApi.md#testPost) | **POST** /test | 



## testPost

> testPost()



Test

### Example

```javascript
import Race01 from 'race01';

let apiInstance = new Race01.TestApi();
apiInstance.testPost().then(() => {
  console.log('API called successfully.');
}, (error) => {
  console.error(error);
});

```

### Parameters

This endpoint does not need any parameter.

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


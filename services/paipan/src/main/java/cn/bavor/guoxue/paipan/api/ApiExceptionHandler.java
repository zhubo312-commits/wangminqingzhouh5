package cn.bavor.guoxue.paipan.api;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    public record FieldError(String field, String message) {}
    public record ErrorResponse(String code, String message, List<FieldError> errors) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> invalid(MethodArgumentNotValidException exception) {
        List<FieldError> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldError(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.unprocessableEntity()
                .body(new ErrorResponse("VALIDATION_ERROR", "请求参数有误", errors));
    }

    @ExceptionHandler({IllegalArgumentException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ErrorResponse> badInput(Exception exception) {
        String message = exception instanceof IllegalArgumentException ? exception.getMessage() : "请求内容格式有误";
        return ResponseEntity.unprocessableEntity()
                .body(new ErrorResponse("VALIDATION_ERROR", message, List.of()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> failure() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("ALGORITHM_ERROR", "排盘服务暂时无法计算", List.of()));
    }
}

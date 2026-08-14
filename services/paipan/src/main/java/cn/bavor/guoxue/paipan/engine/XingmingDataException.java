package cn.bavor.guoxue.paipan.engine;

public class XingmingDataException extends RuntimeException {
    private final String field;
    private final boolean integrityFailure;

    private XingmingDataException(String field, String message, boolean integrityFailure) {
        super(message);
        this.field = field;
        this.integrityFailure = integrityFailure;
    }

    public static XingmingDataException unavailable(String field, String message) {
        return new XingmingDataException(field, message, false);
    }

    public static XingmingDataException integrity(String message) {
        return new XingmingDataException("dataset", message, true);
    }

    public String field() {
        return field;
    }

    public boolean integrityFailure() {
        return integrityFailure;
    }
}

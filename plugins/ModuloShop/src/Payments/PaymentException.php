<?php

namespace Plugins\ModuloShop\src\Payments;

use RuntimeException;

/**
 * A provider refused or could not be reached. The message is safe to show the
 * customer; details go to the log.
 */
class PaymentException extends RuntimeException {}
